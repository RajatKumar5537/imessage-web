import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";
import { clientIp, rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

const GENERIC_ERROR = "Invalid email or security PIN";

export async function POST(req: Request) {
  try {
    if (!rateLimit(`reset:${clientIp(req)}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
    }

    const { email, password, securityPin } = await req.json();

    if (!email || !password || !securityPin) {
      return NextResponse.json(
        { error: "Email, new password, and security PIN are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    const pin = String(securityPin).trim();
    if (!/^\d{4,6}$/.test(pin)) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 403 });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user?.securityPin) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 403 });
    }

    const isPinMatch = await bcrypt.compare(pin, user.securityPin);
    if (!isPinMatch) {
      return NextResponse.json({ error: GENERIC_ERROR }, { status: 403 });
    }

    user.password = await bcrypt.hash(password, 12);
    await user.save();

    return NextResponse.json(
      { success: true, message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}
