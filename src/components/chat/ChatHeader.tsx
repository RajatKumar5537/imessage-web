"use client";

import React, { useState } from "react";
import {
  ChevronDown,
  Phone,
  Video,
  Search,
  MoreVertical,
  Users,
  Shield,
  Clock,
  Sparkles,
  Trash2,
  Lock,
  X,
  ArrowLeft,
} from "lucide-react";

interface ChatHeaderProps {
  conversation: {
    _id: string;
    type: "direct" | "group";
    name: string;
    icon?: string;
    isOnline?: boolean;
    lastSeen?: string | Date;
    participants?: string[];
    participantDetails?: any[];
    disappearingHours?: number;
  };
  totalUnreadCount?: number;
  onBackToConversations: () => void;
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onOpenSearch: () => void;
  onOpenInfo: () => void;
  onClearChat: () => void;
  isTyping?: boolean;
  typingUserName?: string;
}

export default function ChatHeader({
  conversation,
  totalUnreadCount = 0,
  onBackToConversations,
  onStartAudioCall,
  onStartVideoCall,
  onOpenSearch,
  onOpenInfo,
  onClearChat,
  isTyping = false,
  typingUserName = "",
}: ChatHeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  const formatLastSeen = (dateInput?: string | Date) => {
    if (!dateInput) return "Offline";
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return "Offline";
    const now = new Date();
    const isToday =
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear();

    const timeStr = d.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return `Last seen today at ${timeStr}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isYesterday) {
      return `Last seen yesterday at ${timeStr}`;
    }

    const dateStr = d.toLocaleDateString([], {
      day: "numeric",
      month: "short",
    });
    return `Last seen ${dateStr} at ${timeStr}`;
  };

  return (
    <header className="flex items-center justify-between px-3 sm:px-5 py-2.5 sm:py-3 border-b border-white/10 bg-[#070712]/95 backdrop-blur-xl z-30 select-none transition-colors">
      {/* LEFT: PARTNER AVATAR, NAME & STATUS */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Back Button */}
        <button
          type="button"
          onClick={onBackToConversations}
          className="sm:hidden p-1.5 -ml-1 text-slate-300 hover:text-white cursor-pointer active:scale-95 touch-manipulation"
          title="Back to chats"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        {/* Contact Info Header Trigger (Click opens ContactProfileModal) */}
        <button
          type="button"
          onClick={onOpenInfo}
          className="flex items-center gap-2.5 cursor-pointer group py-1 px-1.5 -mx-1.5 rounded-xl hover:bg-white/[0.06] transition-all select-none active:scale-[0.98] text-left border-0 bg-transparent"
          title="View Contact Info & Settings"
        >
          {/* Avatar & Online Presence */}
          <div className="relative flex-shrink-0">
            {conversation.icon ? (
              <img
                src={conversation.icon}
                alt={conversation.name}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover ring-1 ring-blue-400/40 shadow-inner"
              />
            ) : (
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 font-bold text-xs sm:text-sm shadow-inner flex items-center justify-center">
                {getInitials(conversation.name)}
              </div>
            )}
            {conversation.isOnline && (
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#30D158] border-2 border-[#070712] shadow-sm animate-pulse" />
            )}
          </div>

          {/* Contact Name & Live Status with chevron cue */}
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-blue-400 transition-colors">
                {conversation.name}
              </h3>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-400 transition-colors flex-shrink-0" />
            </div>

            <p className="text-[9px] sm:text-[10px] tracking-wide truncate mt-0.5">
              {isTyping ? (
                <span className="text-blue-400 font-bold flex items-center gap-1 animate-pulse font-mono">
                  ✍️ {typingUserName || "typing"}...
                </span>
              ) : conversation.type === "group" ? (
                <span className="text-slate-400">
                  {conversation.participants?.length || 0} members
                </span>
              ) : conversation.isOnline ? (
                <span className="text-[#30D158] font-medium flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#30D158] inline-block animate-ping flex-shrink-0" />
                  Online
                </span>
              ) : (
                <span className="text-slate-400 font-mono">
                  {conversation.lastSeen
                    ? formatLastSeen(conversation.lastSeen)
                    : conversation.disappearingHours && conversation.disappearingHours > 0
                    ? `Disappearing • ${conversation.disappearingHours}h`
                    : "Offline"}
                </span>
              )}
            </p>
          </div>
        </button>
      </div>

      {/* RIGHT: AUDIO CALL, VIDEO CALL & OPTIONS */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Audio Call Pill */}
        <button
          type="button"
          onClick={onStartAudioCall}
          className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-white/[0.07] border border-white/10 hover:bg-[#30D158]/20 text-slate-200 hover:text-[#30D158] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
          title="Start Encrypted Audio Call"
        >
          <Phone className="w-4 h-4 text-[#30D158]" />
          <span className="hidden sm:inline">Audio</span>
        </button>

        {/* Video Call Pill */}
        <button
          type="button"
          onClick={onStartVideoCall}
          className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-white/[0.07] border border-white/10 hover:bg-blue-500/20 text-slate-200 hover:text-blue-400 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
          title="Start Encrypted Video Call"
        >
          <Video className="w-4 h-4 text-blue-400" />
          <span className="hidden sm:inline">Video</span>
        </button>

        {/* Search Conversation */}
        <button
          type="button"
          onClick={onOpenSearch}
          className="p-2 rounded-xl bg-white/[0.07] border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer hidden md:flex active:scale-95"
          title="Search messages"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Dropdown Options */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-xl bg-white/[0.07] border border-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all cursor-pointer active:scale-95"
            title="Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-52 bg-[#0c0c1e]/98 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onOpenInfo();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 text-left transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Contact Information</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onOpenSearch();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-slate-200 hover:bg-white/10 text-left transition-all cursor-pointer"
                >
                  <Search className="w-4 h-4 text-blue-400" />
                  <span>Search Messages</span>
                </button>

                <div className="my-1 border-t border-white/10" />

                <button
                  type="button"
                  onClick={() => {
                    onClearChat();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/15 text-left transition-all cursor-pointer font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Conversation History</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
