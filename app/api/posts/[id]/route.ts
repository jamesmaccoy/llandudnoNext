import { NextRequest, NextResponse } from "next/server";
import { getProperty, createProperty, isUserAdmin } from "@/lib/firebase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const property = await getProperty(id);
    if (!property) {
      return NextResponse.json({ success: false, error: "Property not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: property });
  } catch (err: any) {
    console.error("GET /api/posts/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check admin permissions
    const userId = request.headers.get("x-user-id");
    const email = request.headers.get("x-user-email");
    if (!userId || !(await isUserAdmin(userId, email))) {
      return NextResponse.json({ success: false, error: "Unauthorized access: admin privileges required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { title, slug, basePricePerNight, airbnbCalendarUrl, googleCalendarUrl } = body;

    if (!title || !slug || basePricePerNight === undefined) {
      return NextResponse.json({ success: false, error: "Missing required fields (title, slug, basePricePerNight)" }, { status: 400 });
    }

    const price = Number(basePricePerNight);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ success: false, error: "basePricePerNight must be a positive number" }, { status: 400 });
    }

    // Call createProperty passing the id to ensure overwrite/update rather than duplicate
    const property = await createProperty({
      id,
      title,
      slug: slug.trim().toLowerCase(),
      basePricePerNight: price,
      airbnbCalendarUrl: airbnbCalendarUrl || "",
      googleCalendarUrl: googleCalendarUrl || ""
    });

    return NextResponse.json({ success: true, data: property });
  } catch (err: any) {
    console.error("PUT /api/posts/[id] error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
