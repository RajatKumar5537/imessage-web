import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import Conversation from "@/lib/models/Conversation";
import Message from "@/lib/models/Message";
import { decryptField, encryptField } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET() {
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

    // Fetch conversations where user is a participant
    const conversations = await Conversation.find({
      participants: currentUserId,
      clearedFor: { $ne: currentUserId },
    })
      .sort({ updatedAt: -1 })
      .lean();

    // Collect all participant user IDs to populate details
    const allParticipantIds = Array.from(
      new Set(conversations.flatMap((c) => c.participants || []))
    );

    const users = await User.find({ _id: { $in: allParticipantIds } }).select("name email avatar isOnline lastSeen statusMessage").lean();
    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    // Calculate unread messages count for each conversation
    const detailedConversations = await Promise.all(
      conversations.map(async (conv: any) => {
        const otherParticipantIds = (conv.participants || []).filter((id: string) => id !== currentUserId);
        const otherUsers = otherParticipantIds.map((id: string) => userMap.get(id)).filter(Boolean);

        // Unread messages count (messages in conversation not sent by me and not in readBy)
        const unreadCount = await Message.countDocuments({
          conversationId: conv._id.toString(),
          senderId: { $ne: currentUserId },
          "readBy.userId": { $ne: currentUserId },
          clearedFor: { $ne: currentUserId },
          isDeleted: false,
        });

        // Determine title & avatar
        let displayName = conv.name;
        let displayAvatar = conv.icon;
        let displayOnline = false;

        if (conv.type === "direct") {
          const peer = otherUsers[0];
          displayName = peer ? peer.name : "Contact";
          displayAvatar = peer ? peer.avatar : "";
          displayOnline = peer ? Boolean(peer.isOnline) : false;
        }

        return {
          _id: conv._id.toString(),
          type: conv.type,
          name: displayName,
          icon: displayAvatar,
          participants: conv.participants,
          participantDetails: (conv.participants || []).map((id: string) => userMap.get(id)).filter(Boolean),
          admins: conv.admins || [],
          isPinned: (conv.isPinnedBy || []).includes(currentUserId),
          disappearingHours: conv.disappearingHours || 0,
          lastMessage: conv.lastMessage
            ? {
                ...conv.lastMessage,
                text: decryptField(conv.lastMessage.text),
              }
            : null,
          unreadCount,
          isOnline: displayOnline,
          updatedAt: conv.updatedAt,
        };
      })
    );

    return NextResponse.json(detailedConversations);
  } catch (error: any) {
    console.error("GET Conversations Error:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
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

    const { type, recipientId, recipientEmail, name, participantIds } = await req.json();

    if (type === "group") {
      if (!name?.trim()) {
        return NextResponse.json({ error: "Group name is required" }, { status: 400 });
      }
      const members = Array.from(new Set([currentUserId, ...(participantIds || [])]));
      if (members.length < 2) {
        return NextResponse.json({ error: "A group must have at least 2 members" }, { status: 400 });
      }

      const newGroup = await Conversation.create({
        type: "group",
        name: name.trim(),
        icon: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name.trim())}`,
        participants: members,
        admins: [currentUserId],
        createdBy: currentUserId,
        lastMessage: {
          text: encryptField(`Group "${name.trim()}" created`),
          senderId: currentUserId,
          senderName: currentUser.name,
          createdAt: new Date(),
        },
      });

      return NextResponse.json(newGroup, { status: 201 });
    }

    // Direct conversation
    let targetRecipientId = recipientId;
    if (!targetRecipientId && recipientEmail) {
      const peer = await User.findOne({ email: recipientEmail.toLowerCase().trim() });
      if (peer) targetRecipientId = peer._id.toString();
    }

    if (!targetRecipientId) {
      return NextResponse.json({ error: "Recipient is required" }, { status: 400 });
    }

    // Check if direct conversation already exists
    let existingConv = await Conversation.findOne({
      type: "direct",
      participants: { $all: [currentUserId, targetRecipientId], $size: 2 },
    });

    if (existingConv) {
      return NextResponse.json(existingConv);
    }

    const newConv = await Conversation.create({
      type: "direct",
      participants: [currentUserId, targetRecipientId],
      lastMessage: {
        text: encryptField("Started a conversation"),
        senderId: currentUserId,
        senderName: currentUser.name,
        createdAt: new Date(),
      },
    });

    return NextResponse.json(newConv, { status: 201 });
  } catch (error: any) {
    console.error("POST Conversation Error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
