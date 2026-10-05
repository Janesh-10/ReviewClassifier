import { NextResponse } from "next/server";
import { classifyReview } from "@/lib/classifier";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const { id, review } = body || {};

    if (!review) {
      return NextResponse.json(
        {
          error:
            'Invalid request body. Expected JSON with "review" (and optional "id").',
        },
        { status: 400 },
      );
    }

    console.log(
      `POST /api/classified received for review id: ${id !== undefined ? id : "N/A"}`,
    );
    const result = await classifyReview({ id, review });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Error in /api/classified:", err);
    return NextResponse.json(
      { error: "Failed to classify review", details: err.message },
      { status: 500 },
    );
  }
}
