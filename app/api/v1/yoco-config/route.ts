import { NextResponse } from "next/server";

export async function GET() {
  const publicKey = process.env.TEST_PUB_KEY || process.env.YOCO_PUBLIC_KEY || "pk_test_36973fa06LKI7eoefab4";
  return NextResponse.json({ publicKey });
}
