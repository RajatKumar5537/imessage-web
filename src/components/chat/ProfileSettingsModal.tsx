"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Sparkles, Check, Smile, Shield, Mail } from "lucide-react";
import AvatarPicker from "@/components/ui/AvatarPicker";
import { DEFAULT_AVATAR, getFallbackAvatar } from "@/lib/avatars";

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: {
    name: string;
    email: string;
    avatar?: string;
    statusMessage?: string;
  };
  onProfileUpdated: (updated: { name: string; avatar: string; statusMessage: string }) => void;
}

export default function ProfileSettingsModal({
  isOpen,
  onClose,
  currentUser,
  onProfileUpdated,
}: ProfileSettingsModalProps) {
  const [name, setName] = useState(currentUser.name || "");
  const [avatar, setAvatar] = useState(currentUser.avatar || getFallbackAvatar(currentUser.name, "user"));
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage || "Hey there! I am using iMessage 🚀");
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          avatar,
          statusMessage: statusMessage.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      setSavedSuccess(true);
      onProfileUpdated({
        name: name.trim(),
        avatar,
        statusMessage: statusMessage.trim(),
      });

      setTimeout(() => {
        onClose();
        setSavedSuccess(false);
      }, 900);
    } catch (err: any) {
      setError(err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-lg max-h-[92dvh] bg-neutral-900/95 border border-white/15 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl flex flex-col my-auto"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 sm:py-5 flex items-center justify-between border-b border-white/10 bg-white/[0.03] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Edit Profile & Avatar</h2>
                <p className="text-xs text-neutral-400">Customize your public identity</p>
              </div>
            </div>

            {/* Prominent High-Contrast Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all border border-white/20 shadow-md flex-shrink-0 cursor-pointer"
              title="Close"
            >
              <X className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </button>
          </div>

          <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-xs text-red-300 text-center font-medium">
                {error}
              </div>
            )}

            {/* Avatar Preview */}
            <div className="flex flex-col items-center justify-center pt-1 pb-2">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-blue-500/60 shadow-2xl bg-neutral-800 flex items-center justify-center">
                  <img
                    src={avatar}
                    alt={name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 ring-2 ring-neutral-900 shadow-md" />
              </div>
              <p className="text-[11px] text-neutral-400 mt-2 font-medium">Active Avatar Preview</p>
            </div>

            {/* Avatar Picker */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-2">
                Choose Avatar Style
              </label>
              <AvatarPicker
                selectedUrl={avatar}
                onSelect={(newUrl) => setAvatar(newUrl)}
                userName={name}
              />
            </div>

            {/* Display Name Input */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Display Name
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.07] focus-within:bg-white/[0.07] border border-white/10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 rounded-2xl transition-all shadow-inner">
                <User className="w-4.5 h-4.5 text-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                  placeholder="Your Name"
                />
              </div>
            </div>

            {/* Status / Bio Input */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Status / Bio
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.07] focus-within:bg-white/[0.07] border border-white/10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 rounded-2xl transition-all shadow-inner">
                <Smile className="w-4.5 h-4.5 text-neutral-400 flex-shrink-0" />
                <input
                  type="text"
                  value={statusMessage}
                  onChange={(e) => setStatusMessage(e.target.value)}
                  className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none"
                  placeholder="What's on your mind?"
                />
              </div>
            </div>

            {/* Email (Apple ID) */}
            <div>
              <label className="text-xs font-semibold text-neutral-400 block mb-1.5">
                Registered Apple ID
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.02] border border-white/5 rounded-2xl text-neutral-400 text-xs font-mono">
                <Shield className="w-4 h-4 text-neutral-500 flex-shrink-0" />
                <span className="truncate">{currentUser.email}</span>
              </div>
            </div>

            {/* Save Changes Action Button */}
            <div className="pt-2 pb-1">
              <button
                type="submit"
                disabled={saving}
                className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  savedSuccess
                    ? "bg-emerald-600 shadow-emerald-500/30"
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-500/30 active:scale-[0.99]"
                }`}
              >
                {saving ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Profile Saved!</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
