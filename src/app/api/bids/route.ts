import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { placeBid } from "@/lib/bidding/allocation-service";
import { z } from "zod";

const placeBidSchema = z.object({
  studentId: z.string().cuid(),
  courseOfferingId: z.string().cuid(),
  biddingRoundId: z.string().cuid(),
  pointsAllocated: z.number().int().min(0).max(10000),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.role !== "STUDENT") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = placeBidSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { studentId, courseOfferingId, biddingRoundId, pointsAllocated } =
      parsed.data;

    // Security: ensure studentId matches the session's student profile
    // (prevent IDOR attacks)
    if (studentId !== session.studentProfileId) {
      return NextResponse.json(
        {
          error:
            "You can only place bids for your own student account.",
        },
        { status: 403 }
      );
    }

    const bid = await placeBid({
      studentId,
      courseOfferingId,
      biddingRoundId,
      pointsAllocated,
      performedBy: session.id,
    });

    return NextResponse.json({ success: true, bid }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
