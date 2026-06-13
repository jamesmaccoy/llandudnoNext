import { NextRequest, NextResponse } from "next/server";
import { updateBookingStatus } from "@/lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    console.log("[Yoco Webhook] Received webhook payload:", JSON.stringify(body, null, 2));

    const eventType = body.type || body.event;
    const payload = body.payload || body;
    const metadata = payload.metadata || {};
    
    // Defensive extraction of booking ID
    const bookingId = metadata.bookingId || payload.bookingId || body.bookingId;

    if (!bookingId) {
      console.warn("[Yoco Webhook] No bookingId found in webhook payload.");
      return NextResponse.json({ success: true, message: "Webhook received, but no bookingId was found." });
    }

    if (eventType === "payment.succeeded" || eventType === "checkout.succeeded" || eventType === "charge.succeeded") {
      console.log(`[Yoco Webhook] Payment succeeded for booking ${bookingId}`);
      await updateBookingStatus(bookingId, "paid");
    } else if (eventType === "payment.failed" || eventType === "checkout.failed" || eventType === "charge.failed") {
      console.log(`[Yoco Webhook] Payment failed for booking ${bookingId}`);
      await updateBookingStatus(bookingId, "failed");
    } else {
      console.log(`[Yoco Webhook] Unhandled event type: ${eventType} for booking ${bookingId}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Yoco Webhook] Error processing webhook:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
