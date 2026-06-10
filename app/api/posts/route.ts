import { NextRequest, NextResponse } from "next/server";
import { createProperty, listProperties } from "@/lib/firebase";

export async function GET() {
  try {
    const list = await listProperties();
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    console.error("GET /api/posts error:", err);
    return NextResponse.json({ success: false, data: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title, slug, basePricePerNight } = body;

    if (!title || !slug || basePricePerNight === undefined) {
      return NextResponse.json({ success: false, data: "Missing required fields (title, slug, basePricePerNight)" }, { status: 400 });
    }

    const price = Number(basePricePerNight);
    if (isNaN(price) || price < 0) {
      return NextResponse.json({ success: false, data: "basePricePerNight must be a positive number" }, { status: 400 });
    }

    const property = await createProperty({
      title,
      slug: slug.trim().toLowerCase(),
      basePricePerNight: price
    });

    return NextResponse.json({ success: true, data: property }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/posts error:", err);
    return NextResponse.json({ success: false, data: err.message }, { status: 500 });
  }
}
