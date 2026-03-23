import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const PRICE_MAP = {
  "audit-pack": {
    priceId: process.env.STRIPE_PRICE_AUDIT_PACK!,
    mode: "payment" as const,
  },
  pro: {
    priceId: process.env.STRIPE_PRICE_PRO!,
    mode: "subscription" as const,
  },
};

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to purchase." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const priceType = body?.priceType as keyof typeof PRICE_MAP;

    if (!priceType || !PRICE_MAP[priceType]) {
      return NextResponse.json({ error: "Invalid price type." }, { status: 400 });
    }

    const { priceId, mode } = PRICE_MAP[priceType];

    // Look up or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      mode,
      success_url: `${origin}?checkout=success`,
      cancel_url: `${origin}?checkout=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 },
    );
  }
}
