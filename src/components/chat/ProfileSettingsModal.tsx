"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, User, Sparkles, Check, Smile, Shield, Lock } from "lucide-react";
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
  const [statusMessage, setStatusMessage] = useState(currentUser.statusMessage || "Active now");
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
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-lg overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-md bg-[#0E0E12]/98 border border-white/15 rounded-3xl overflow-hidden shadow-[0_25px_70px_rgba(0,0,0,0.95),0_0_30px_rgba(0,122,255,0.15)] backdrop-blur-3xl flex flex-col my-auto max-h-[92dvh]"
        >
          {/* Header */}
          <div className="px-5 py-3.5 flex items-center justify-between border-b border-white/10 bg-white/[0.02] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-2xl bg-blue-600/20 text-[#007AFF] flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Edit Profile & Avatar</h2>
                <p className="text-[11px] text-neutral-400 mt-0.5">Customize your public identity</p>
              </div>
            </div>
            <button onClick={onClose} type="button" className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-all border border-white/15 cursor-pointer">
              <X className="w-4 h-4 text-white stroke-[2.5]" />
            </button>
          </div>

          <form id="profile-form" onSubmit={handleSave} className="flex-1 overflow-y-auto flex flex-col min-h-0">
            {/* Avatar Hero section */}
            <div className="bg-white/[0.015] py-6 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden border-b border-white/10 flex-shrink-0">
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-52 h-52 bg-blue-500/10 rounded-full blur-3xl" />
              </div>

              <div className="relative z-10">
                <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-[#007AFF]/60 shadow-2xl bg-neutral-800">
                  <img src={avatar} alt={name} className="w-full h-full object-cover" />
                </div>
                <span className="absolute bottom-0.5 right-0.5 w-5 h-5 rounded-full bg-[#30D158] ring-2 ring-neutral-900 shadow-md" />
              </div>

              <div className="space-y-1 z-10">
                <h3 className="text-base font-bold text-white">{name || "Your Profile"}</h3>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-[11px] text-blue-300 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] animate-pulse" />
                  <span>{statusMessage || "Active now"}</span>
                </div>
              </div>

              <div className="px-3 py-2 rounded-xl bg-black/40 border border-white/10 z-10 flex items-center gap-1.5 text-[11px] text-neutral-300">
                <Shield className="w-3 h-3 text-[#007AFF]" />
                <span className="font-mono truncate max-w-[220px]">{currentUser.email}</span>
              </div>
            </div>

            {/* Form fields */}
            <div className="p-5 space-y-4 flex-1">
              {error && (
                <div className="p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-xs text-red-300 text-center">
                  {error}
                </div>
              )}

              {/* Display Name */}
              <div>
                <label className="text-[11px] font-bold text-neutral-200 block mb-1.5 tracking-wide uppercase font-mono">
                  Display Name
                </label>
                <div className="flex items-center gap-2.5 px-3.5 py-3 bg-neutral-800/90 border border-white/15 focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-blue-500/25 rounded-xl transition-all">
                  <User className="w-4 h-4 text-[#007AFF] flex-shrink-0" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                    placeholder="Your Full Name"
                  />
                </div>
              </div>

              {/* Status / Bio */}
              <div>
                <label className="text-[11px] font-bold text-neutral-200 block mb-1.5 tracking-wide uppercase font-mono">
                  Status / Bio
                </label>
                <div className="flex items-center gap-2.5 px-3.5 py-3 bg-neutral-800/90 border border-white/15 focus-within:border-[#007AFF] focus-within:ring-2 focus-within:ring-blue-500/25 rounded-xl transition-all">
                  <Smile className="w-4 h-4 text-[#30D158] flex-shrink-0" />
                  <input
                    type="text"
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    className="w-full bg-transparent text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                    placeholder="e.g. Active now, Busy..."
                  />
                </div>
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="text-[11px] font-bold text-neutral-200 block mb-2 tracking-wide uppercase font-mono">
                  Choose Avatar Style
                </label>
                <AvatarPicker
                  selectedUrl={avatar}
                  onSelect={(newUrl) => setAvatar(newUrl)}
                  userName={name}
                />
              </div>
            </div>
          </form>

          {/* Fixed Bottom Action Bar */}
          <div className="px-5 py-3.5 border-t border-white/10 bg-neutral-950/98 backdrop-blur-xl flex items-center justify-between flex-shrink-0 rounded-b-3xl">
            <span className="text-[11px] text-neutral-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#007AFF]" />
              <span>AES-256 encrypted</span>
            </span>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-bold text-neutral-400 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="profile-form"
                disabled={saving}
                className={`px-6 py-2 rounded-xl font-bold text-xs text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer active:scale-95 ${
                  savedSuccess
                    ? "bg-[#30D158] shadow-[#30D158]/25"
                    : "bg-[#007AFF] hover:bg-[#0071EB] shadow-[#007AFF]/30 disabled:opacity-50"
                }`}
              >
                {saving ? (
                  <>
                    <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Saved!</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

