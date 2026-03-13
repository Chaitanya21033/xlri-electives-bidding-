import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { withdrawBid } from "@/lib/bidding/allocation-service";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const withdrawSchema = z.object({
  studentId: z.string().cuid(),
  courseOfferingId: z.string().cuid(),
  biddingRoundId: z.string().cuid(),
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
    const parsed = withdrawSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    const { studentId, courseOfferingId, biddingRoundId } = parsed.data;

    if (studentId !== session.studentProfileId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Check if round is still active
    const round = await prisma.biddingRound.findUnique({
      where: { id: biddingRoundId },
      select: { status: true },
    });

    const isActiveRound = round?.status === "OPEN";

    const result = await withdrawBid({
      studentId,
      courseOfferingId,
      biddingRoundId,
      performedBy: session.id,
      isActiveRound,
    });

    return NextResponse.json({
      success: true,
      pointsReimbursed: result.pointsReimbursed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
