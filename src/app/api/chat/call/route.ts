import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Call from "@/lib/models/Call";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const currentUserId = currentUser._id.toString();

    const { searchParams } = new URL(req.url, "http://localhost:3000");
    const callId = searchParams.get("callId");

    if (callId) {
      const call = await Call.findById(callId).lean();
      return NextResponse.json(call);
    }

    // Check for active or incoming calls for this user
    const activeCall = await Call.findOne({
      $or: [{ callerId: currentUserId }, { recipientId: currentUserId }],
      status: { $in: ["ringing", "accepted"] },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(activeCall || null);
  } catch (error: any) {
    console.error("GET Call Error:", error);
    return NextResponse.json({ error: "Failed to fetch call" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() });
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    const currentUserId = currentUser._id.toString();

    const {
      action,
      callId,
      conversationId,
      recipientId,
      callType,
      offer,
      answer,
      candidate,
      isCaller,
    } = await req.json();

    // 1. INITIATE A CALL
    if (action === "initiate") {
      if (!conversationId || !recipientId) {
        return NextResponse.json({ error: "conversationId and recipientId are required" }, { status: 400 });
      }

      const recipient = await User.findById(recipientId);
      if (!recipient) {
        return NextResponse.json({ error: "Recipient not found" }, { status: 404 });
      }

      // Terminate any previous dangling calls
      await Call.updateMany(
        {
          $or: [{ callerId: currentUserId }, { recipientId: currentUserId }],
          status: { $in: ["ringing", "accepted"] },
        },
        { status: "ended", endedAt: new Date() }
      );

      const newCall = await Call.create({
        conversationId,
        callerId: currentUserId,
        callerName: currentUser.name,
        callerAvatar: currentUser.avatar || "",
        recipientId: recipient._id.toString(),
        recipientName: recipient.name,
        recipientAvatar: recipient.avatar || "",
        callType: callType || "audio",
        status: "ringing",
        offer: offer || "",
        answer: "",
        callerCandidates: [],
        recipientCandidates: [],
        startedAt: new Date(),
      });

      return NextResponse.json(newCall, { status: 201 });
    }

    // Existing call modifications
    if (!callId) {
      return NextResponse.json({ error: "callId is required for this action" }, { status: 400 });
    }

    const call = await Call.findById(callId);
    if (!call) {
      return NextResponse.json({ error: "Call not found" }, { status: 404 });
    }

    // 2. ACCEPT
    if (action === "accept") {
      call.status = "accepted";
      if (answer) call.answer = answer;
      await call.save();
      return NextResponse.json({ success: true, call });
    }

    // 3. DECLINE / END
    if (action === "decline" || action === "end") {
      call.status = action === "decline" ? "declined" : "ended";
      call.endedAt = new Date();
      if (call.startedAt) {
        call.durationSec = Math.max(0, Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000));
      }
      await call.save();
      return NextResponse.json({ success: true, call });
    }

    // 4. SIGNAL ANSWER
    if (action === "signal-answer") {
      if (answer) call.answer = answer;
      await call.save();
      return NextResponse.json({ success: true });
    }

    // 5. ICE CANDIDATE
    if (action === "candidate") {
      if (candidate) {
        if (isCaller) {
          call.callerCandidates.push(candidate);
        } else {
          call.recipientCandidates.push(candidate);
        }
        await call.save();
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("POST Call Error:", error);
    return NextResponse.json({ error: "Failed to process call signaling" }, { status: 500 });
  }
}
