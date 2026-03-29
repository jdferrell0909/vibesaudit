import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type Stripe from "stripe";

function getWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET!;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, getWebhookSecret());
  } catch {
    console.error("Webhook signature verification failed");
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.client_reference_id;
      if (!userId) break;

      if (session.mode === "payment") {
        // One-time audit pack: atomically increment credits by 10
        const { error: rpcError } = await getSupabaseAdmin().rpc("adjust_audit_credits", {
          user_id: userId,
          delta: 10,
        });

        if (rpcError) {
          console.error("Failed to update audit_credits:", rpcError.code);
        }
      } else if (session.mode === "subscription") {
        // Pro subscription: upgrade plan + store subscription ID
        await getSupabaseAdmin()
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
      const { data: profiles } = await getSupabaseAdmin()
        .from("profiles")
        .select("id")
        .eq("stripe_subscription_id", subscription.id);

      if (profiles && profiles.length > 0) {
        await getSupabaseAdmin()
          .from("profiles")
          .update({ plan: "free", stripe_subscription_id: null })
          .eq("id", profiles[0].id);
      }
      break;
    }

    case "invoice.payment_failed": {
      console.error("Invoice payment failed");
      break;
    }
  }

  return NextResponse.json({ received: true });
}
