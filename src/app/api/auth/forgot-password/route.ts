import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/lib/models/User";
import bcrypt from "bcryptjs";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, password, securityPin } = await req.json();

    if (!email || !password || !securityPin) {
      return NextResponse.json(
        { error: "All fields are required (Email, New Password, and 6-digit Security PIN)" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    if (String(securityPin).trim().length < 4) {
      return NextResponse.json(
        { error: "Security PIN must be at least 4 to 6 digits" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { error: "No account found with this email address" },
        { status: 404 }
      );
    }

    // Verify Security PIN if user already has one configured
    if (user.securityPin) {
      const isPinMatch = await bcrypt.compare(String(securityPin).trim(), user.securityPin);
      if (!isPinMatch) {
        return NextResponse.json(
          { error: "Invalid Security PIN. Password reset denied." },
          { status: 403 }
        );
      }
    } else {
      // Legacy user without PIN configured -> securely set this PIN for them
      user.securityPin = await bcrypt.hash(String(securityPin).trim(), 10);
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);
    user.password = hashedPassword;
    await user.save();

    return NextResponse.json(
      { success: true, message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to reset password" },
      { status: 500 }
    );
  }
}
