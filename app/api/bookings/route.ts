import { NextRequest, NextResponse } from "next/server";
import { createBooking, listBookings } from "@/lib/firebase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId") || undefined;
    const bookings = await listBookings(propertyId);
    return NextResponse.json({ success: true, data: bookings });
  } catch (err: any) {
    console.error("GET /api/bookings error:", err);
    return NextResponse.json({ success: false, data: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const {
      propertyId,
      packageId,
      customerName,
      customerEmail,
      fromDate,
      toDate,
      total
    } = body;

    // Validation
    if (!propertyId || !customerName || !customerEmail || !fromDate || !toDate || total === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields, including total." }, { status: 400 });
    }

    const start = new Date(fromDate);
    const end = new Date(toDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return NextResponse.json({ success: false, error: "Invalid check-in or check-out date." }, { status: 400 });
    }

    // 1. Conflict checking: Fetch bookings for this property
    const existingBookings = await listBookings(propertyId);
    
    // Check overlapping ranges: fromDate < existing.toDate && toDate > existing.fromDate
    const isOverlapping = existingBookings.some((existing: any) => {
      // Exclude failed or refunded status if tracking that
      if (existing.paymentStatus === "failed" || existing.paymentStatus === "refunded") {
        return false;
      }
      const existingStart = new Date(existing.fromDate);
      const existingEnd = new Date(existing.toDate);
      return start < existingEnd && end > existingStart;
    });

    if (isOverlapping) {
      return NextResponse.json({ success: false, error: "The selected dates conflict with an existing booking." }, { status: 400 });
    }

    // 2. Persist the Booking
    const booking = await createBooking({
      propertyId,
      packageId: packageId || null,
      customerName,
      customerEmail,
      fromDate: start.toISOString(),
      toDate: end.toISOString(),
      total: Number(total),
      paymentStatus: "pending"
    });

    return NextResponse.json({ success: true, booking }, { status: 201 });
  } catch (error: any) {
    console.error("POST /api/bookings error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
