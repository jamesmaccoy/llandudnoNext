const CHECKOUT_URL = "https://payments.yoco.com/api/checkouts";

export interface CreateCheckoutProps {
  amountInCents: number;
  description: string;
  metadata?: Record<string, any>;
}

export function parsePriceToCents(pkg: any): number {
  if (typeof pkg.amountInCents === "number" && pkg.amountInCents > 0) {
    return Math.round(pkg.amountInCents);
  }
  if (typeof pkg.amount === "number" && pkg.amount > 0) {
    return Math.round(pkg.amount);
  }
  const raw = pkg.price;
  if (raw == null || raw === "") {
    throw new Error("Package has no price field");
  }
  const normalized = String(raw).replace(/[^\d.]/g, "");
  const rands = parseFloat(normalized);
  if (!Number.isFinite(rands) || rands <= 0) {
    throw new Error("Invalid price on package document");
  }
  return Math.round(rands * 100);
}

export async function createCheckout({ amountInCents, description, metadata }: CreateCheckoutProps): Promise<string> {
  const secretKey = (
    process.env.YOCO_SEC ||
    process.env.YOCO_SECRET_KEY || 
    process.env.LIVE_YOCO_SEC || 
    process.env.TEST_YOCO_SEC
  )?.trim();
  const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");

  console.log(`[Yoco Checkout] Initializing checkout: amount=${amountInCents}, description="${description}", keyPrefix=${secretKey ? secretKey.substring(0, 12) + "..." : "undefined"}`);

  if (!secretKey) {
    throw new Error(
      "YOCO_SECRET_KEY or TEST_YOCO_SEC environment variable is not configured. " +
      "Please add your Yoco secret key to environment variables (.env.local) to process checkout redirects."
    );
  }

  if (secretKey.startsWith("pk_")) {
    throw new Error(
      "YOCO_SECRET_KEY must be a secret key (sk_test_... or sk_live_...), not a public key (pk_...)."
    );
  }

  const bookingId = metadata?.bookingId || "";
  const successUrl = process.env.YOCO_SUCCESS_URL || `${siteUrl}/?payment=success${bookingId ? `&bookingId=${bookingId}` : ""}`;
  const cancelUrl = process.env.YOCO_CANCEL_URL || `${siteUrl}/?payment=cancel${bookingId ? `&bookingId=${bookingId}` : ""}`;
  const failureUrl = process.env.YOCO_FAILURE_URL || `${siteUrl}/?payment=failed${bookingId ? `&bookingId=${bookingId}` : ""}`;

  const body = {
    amount: amountInCents,
    currency: "ZAR",
    description: description,
    metadata: metadata || {},
    successUrl: successUrl,
    cancelUrl: cancelUrl,
    failureUrl: failureUrl,
  };

  let response = await fetch(CHECKOUT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  let data = await response.json().catch(() => ({}));

  // Fallback 1: If the key failed with 403, and we have a test key that is different, retry with TEST_YOCO_SEC on payments.yoco.com
  if (!response.ok && response.status === 403 && process.env.TEST_YOCO_SEC) {
    const trimmedTestKey = process.env.TEST_YOCO_SEC.trim();
    if (secretKey !== trimmedTestKey) {
      console.warn("⚠️ Resolved key failed with 403. Retrying with TEST_YOCO_SEC on payments.yoco.com...");
      const testResponse = await fetch(CHECKOUT_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${trimmedTestKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (testResponse.ok) {
        response = testResponse;
        data = await response.json().catch(() => ({}));
      }
    }
  }

  // Fallback 2: If we are still failing with 403 and the key is a test key, it might be a beta staging key.
  // Retry against payments.yocobeta.co.za
  const currentKey = (response.ok ? "" : (secretKey || "")).trim();
  if (!response.ok && response.status === 403 && currentKey.startsWith("sk_test_")) {
    console.warn("⚠️ Received 403 from payments.yoco.com. Retrying with payments.yocobeta.co.za sandbox endpoint...");
    const BETA_CHECKOUT_URL = "https://payments.yocobeta.co.za/api/checkouts";
    const betaResponse = await fetch(BETA_CHECKOUT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (betaResponse.ok) {
      response = betaResponse;
      data = await response.json().catch(() => ({}));
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.error?.message || JSON.stringify(data);
    throw new Error(`Yoco checkout failed (${response.status}): ${message}`);
  }

  const redirectUrl = data.redirectUrl || data.redirect_url;
  if (!redirectUrl) {
    throw new Error("Yoco did not return a redirectUrl");
  }

  return redirectUrl;
}
