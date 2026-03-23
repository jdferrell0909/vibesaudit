import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type Stripe from "stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  console.log("Stripe webhook received:", event.type);

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      console.log("Checkout completed — userId:", userId, "mode:", session.mode);
      if (!userId) break;

      if (session.mode === "payment") {
        // One-time audit pack: increment credits by 10
        const { data: profile, error: fetchError } = await supabaseAdmin
          .from("profiles")
          .select("audit_credits")
          .eq("id", userId)
          .single();

        if (fetchError) {
          console.error("Failed to fetch profile for credit update:", fetchError);
          break;
        }

        const currentCredits = profile?.audit_credits ?? 0;

        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({ audit_credits: currentCredits + 10 })
          .eq("id", userId);

        if (updateError) {
          console.error("Failed to update audit_credits:", updateError);
        } else {
          console.log("Credits updated:", currentCredits, "→", currentCredits + 10);
        }
      } else if (session.mode === "subscription") {
        // Pro subscription: upgrade plan + store subscription ID
        await supabaseAdmin
          .from("profiles")
          .update({
            plan: "pro",
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", userId);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      // Find user by subscription ID and downgrade
      const { data: profiles } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("stripe_subscription_id", subscription.id);

      if (profiles && profiles.length > 0) {
        await supabaseAdmin
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("id", profiles[0].id);
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.error("Payment failed for customer:", invoice.customer);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
