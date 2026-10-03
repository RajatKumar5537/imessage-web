import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import { getFallbackAvatar } from "@/lib/avatars";
import { clientIp, rateLimit } from "@/lib/rateLimit";

function inviteMatches(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

export async function POST(req: Request) {
  try {
    if (!rateLimit(`register:${clientIp(req)}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const { name, email, password, avatar, securityPin, inviteCode } = await req.json();

    const expectedInvite = process.env.REGISTRATION_INVITE_CODE;
    if (process.env.NODE_ENV === "production" && !expectedInvite) {
      return NextResponse.json({ error: "Registration is unavailable" }, { status: 503 });
    }
    if (expectedInvite && !inviteMatches(String(inviteCode || ""), expectedInvite)) {
      return NextResponse.json({ error: "Invalid invite code" }, { status: 403 });
    }

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Name, email, and password are required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const pin = String(securityPin || "").trim();
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: "Security PIN must be 4 to 6 digits" }, { status: 400 });
    }

    await dbConnect();
    const cleanEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return NextResponse.json({ error: "Could not create an account with these details" }, { status: 409 });
    }

    const newUser = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: await bcrypt.hash(password, 12),
      securityPin: await bcrypt.hash(pin, 12),
      avatar: avatar || getFallbackAvatar(name.trim(), "user"),
      statusMessage: "Hey there! I am using iMessage 🚀",
      isOnline: true,
      lastSeen: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        user: {
          id: newUser._id.toString(),
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json({ error: "Failed to register account" }, { status: 500 });
  }
}
