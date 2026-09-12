"use client";

import React from "react";
import {
  ChevronLeft,
  Phone,
  Video,
  Search,
  MoreVertical,
  Users,
  Shield,
  Clock,
  Sparkles,
  Trash2,
} from "lucide-react";
import { getFallbackAvatar } from "@/lib/avatars";

interface ChatHeaderProps {
  conversation: {
    _id: string;
    type: "direct" | "group";
    name: string;
    icon?: string;
    isOnline?: boolean;
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
  const [showDropdown, setShowDropdown] = React.useState(false);

  return (
    <header className="relative z-30 flex items-center justify-between px-3 py-2.5 bg-neutral-900/80 backdrop-blur-2xl border-b border-white/10 select-none">
      {/* LEFT: BACK PILL (< 8) */}
      <div className="flex items-center gap-1">
        <button
          onClick={onBackToConversations}
          className="flex items-center gap-0.5 px-2 py-1.5 rounded-full text-blue-400 hover:bg-white/10 transition-all font-medium text-sm md:hidden group"
          title="Back to Chats"
        >
          <ChevronLeft className="w-5 h-5 -ml-1 group-hover:-translate-x-0.5 transition-transform" />
          {totalUnreadCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-1.5 py-0.2 rounded-full font-bold">
              {totalUnreadCount}
            </span>
          )}
        </button>

        {/* Desktop Back button if needed */}
        <button
          onClick={onBackToConversations}
          className="hidden md:flex items-center gap-1 text-neutral-400 hover:text-white px-2 py-1 rounded-lg text-xs font-medium hover:bg-white/5 transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Chats</span>
          {totalUnreadCount > 0 && (
            <span className="bg-blue-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5">
              {totalUnreadCount}
            </span>
          )}
        </button>
      </div>

      {/* CENTER: CONTACT / GROUP AVATAR & NAME (MATCHING SCREENSHOT #2) */}
      <div
        onClick={onOpenInfo}
        className="flex flex-col items-center cursor-pointer group px-3 py-0.5 rounded-2xl hover:bg-white/5 transition-all"
      >
        <div className="relative">
          <img
            src={conversation.icon || getFallbackAvatar(conversation.name, conversation.type)}
            alt={conversation.name}
            className="w-10 h-10 rounded-full object-cover border border-white/15 shadow-md group-hover:scale-105 transition-transform"
          />
          {conversation.type === "direct" && conversation.isOnline && (
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-900 shadow-sm" />
          )}
        </div>

        <div className="flex items-center gap-1 mt-0.5">
          <span className="font-semibold text-sm text-white/95 group-hover:text-blue-300 transition-colors">
            {conversation.name}
          </span>
          <span className="text-neutral-500 text-xs">›</span>
        </div>

        {/* STATUS / TYPING INDICATOR */}
        <div className="text-[11px] text-neutral-400 font-normal">
          {isTyping ? (
            <span className="text-blue-400 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              {typingUserName || "Someone"} is typing...
            </span>
          ) : conversation.type === "group" ? (
            <span>{conversation.participants?.length || 0} members</span>
          ) : conversation.isOnline ? (
            <span className="text-emerald-400 font-medium">Online</span>
          ) : (
            <span>Tap for contact info</span>
          )}
        </div>
      </div>

      {/* RIGHT: CALL, VIDEO & SEARCH ACTIONS */}
      <div className="flex items-center gap-1 text-blue-400">
        <button
          onClick={onStartAudioCall}
          className="p-2 rounded-full hover:bg-white/10 hover:text-blue-300 transition-all"
          title="Start Audio Call"
        >
          <Phone className="w-4 h-4" />
        </button>

        <button
          onClick={onStartVideoCall}
          className="p-2 rounded-full hover:bg-white/10 hover:text-blue-300 transition-all"
          title="Start FaceTime / Video Call"
        >
          <Video className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSearch}
          className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-all hidden sm:flex"
          title="Search conversation"
        >
          <Search className="w-4 h-4" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 rounded-full hover:bg-white/10 text-neutral-400 hover:text-white transition-all"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-neutral-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl z-50 flex flex-col gap-1">
                <button
                  onClick={() => {
                    onOpenInfo();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-neutral-200 hover:bg-white/10 text-left transition-all"
                >
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>Conversation Info</span>
                </button>

                <button
                  onClick={() => {
                    onOpenSearch();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-neutral-200 hover:bg-white/10 text-left transition-all sm:hidden"
                >
                  <Search className="w-3.5 h-3.5 text-blue-400" />
                  <span>Search Messages</span>
                </button>

                <button
                  onClick={() => {
                    onClearChat();
                    setShowDropdown(false);
                  }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 text-left transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Chat History</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
