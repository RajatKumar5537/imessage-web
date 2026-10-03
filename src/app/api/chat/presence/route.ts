import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Presence from "@/lib/models/Presence";
import { userInConversation } from "@/lib/membership";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();
    let currentUserId = (session.user as any).id;
    if (!currentUserId) {
      const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() }).lean();
      if (!currentUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      currentUserId = currentUser._id.toString();
    }

    const { searchParams } = new URL(req.url, "http://localhost:3000");
    const conversationId = searchParams.get("conversationId");
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
    }

    const allowed = await userInConversation(conversationId, currentUserId);
    if (!allowed) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const cutoff = new Date(Date.now() - 15 * 1000);

    const presences = await Presence.find({
      lastActiveAt: { $gt: cutoff },
      activeConversationId: conversationId,
    }).lean();
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

    let currentUserId = (session.user as any).id;
    let userName = session.user.name || "User";
    let userEmail = session.user.email || "";

    if (!currentUserId) {
      const currentUser = await User.findOne({ email: session.user.email.toLowerCase().trim() }).lean();
      if (!currentUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      currentUserId = currentUser._id.toString();
      userName = currentUser.name || userName;
      userEmail = currentUser.email || userEmail;
    }

    const { activeConversationId, isTypingIn } = await req.json();

    let conversationId: string | null = activeConversationId || null;
    let typingIn: string | null = isTypingIn || null;
    if (conversationId && !(await userInConversation(conversationId, currentUserId))) {
      conversationId = null;
      typingIn = null;
    }
    if (typingIn && typingIn !== conversationId && !(await userInConversation(typingIn, currentUserId))) {
      typingIn = null;
    }

    const presencePromise = Presence.findOneAndUpdate(
      { userId: currentUserId },
      {
        userEmail,
        userName,
        activeConversationId: conversationId,
        isTypingIn: typingIn,
        lastActiveAt: new Date(),
      },
      { upsert: true, new: true }
    );

    const userPromise = User.findByIdAndUpdate(currentUserId, {
      isOnline: true,
      lastSeen: new Date(),
    });

    const [presence] = await Promise.all([presencePromise, userPromise]);

    return NextResponse.json({ success: true, presence });
  } catch (error: any) {
    console.error("POST Presence Error:", error);
    return NextResponse.json({ error: "Failed to update presence" }, { status: 500 });
  }
}
