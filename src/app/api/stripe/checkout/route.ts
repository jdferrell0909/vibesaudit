import { NextRequest, NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function getPriceMap() {
  return {
    "audit-pack": {
      priceId: process.env.STRIPE_PRICE_AUDIT_PACK!,
      mode: "payment" as const,
    },
    pro: {
      priceId: process.env.STRIPE_PRICE_PRO!,
      mode: "subscription" as const,
    },
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Sign in to purchase." }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const priceMap = getPriceMap();
    const priceType = body?.priceType as keyof ReturnType<typeof getPriceMap>;

    if (!priceType || !priceMap[priceType]) {
      return NextResponse.json({ error: "Invalid price type." }, { status: 400 });
    }

    const { priceId, mode } = priceMap[priceType];

    // Look up or create Stripe customer
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;

    if (!customerId) {
      const customer = await getStripe().customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await getSupabaseAdmin()
        .from("profiles")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);
    }

    const origin = request.headers.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "";

    const session = await getStripe().checkout.sessions.create({
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
