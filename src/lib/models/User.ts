import mongoose, { Schema, model, models } from "mongoose";

const UserSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    avatar: {
      type: String,
      default: "",
    },
    statusMessage: {
      type: String,
      default: "Available",
      trim: true,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    themePreference: {
      type: String,
      enum: ["dark", "oled", "cyberpunk", "light"],
      default: "dark",
    },
    soundEnabled: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    collection: "prime_users",
  }
);

if (models.PrimeUser) {
  delete (models as any).PrimeUser;
}

const User = model("PrimeUser", UserSchema);
export default User;
