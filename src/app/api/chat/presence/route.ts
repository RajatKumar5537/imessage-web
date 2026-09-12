import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Presence from "@/lib/models/Presence";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(req.url, "http://localhost:3000");
    const conversationId = searchParams.get("conversationId");

    const cutoff = new Date(Date.now() - 15 * 1000); // active within last 15s

    const query: any = {
      lastActiveAt: { $gt: cutoff },
    };

    if (conversationId) {
      query.activeConversationId = conversationId;
    }

    const presences = await Presence.find(query).lean();
    return NextResponse.json(presences);
  } catch (error: any) {
    console.error("GET Presence Error:", error);
    return NextResponse.json({ error: "Failed to fetch presence" }, { status: 500 });
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

    const { activeConversationId, isTypingIn } = await req.json();

    const presence = await Presence.findOneAndUpdate(
      { userId: currentUserId },
      {
        userEmail: currentUser.email,
        userName: currentUser.name,
        activeConversationId: activeConversationId || null,
        isTypingIn: isTypingIn || null,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true }
    );

    // Also update User isOnline
    await User.findByIdAndUpdate(currentUserId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    return NextResponse.json({ success: true, presence });
  } catch (error: any) {
    console.error("POST Presence Error:", error);
    return NextResponse.json({ error: "Failed to update presence" }, { status: 500 });
  }
}
