"use client";

import React, { useState } from "react";
import {
  Search,
  Plus,
  Users,
  Pin,
  MessageSquare,
  Sparkles,
  UserPlus,
  LogOut,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { soundEngine } from "@/lib/audio";
import { getFallbackAvatar } from "@/lib/avatars";

export interface ConversationItem {
  _id: string;
  type: "direct" | "group";
  name: string;
  icon?: string;
  isOnline?: boolean;
  isPinned?: boolean;
  unreadCount?: number;
  participants?: string[];
  participantDetails?: any[];
  disappearingHours?: number;
  lastMessage?: {
    text: string;
    senderName?: string;
    senderId?: string;
    createdAt?: string | Date;
    effect?: string;
    mediaType?: string;
  };
  updatedAt?: string | Date;
}

interface ConversationListProps {
  conversations: ConversationItem[];
  selectedId: string | null;
  onSelectConversation: (id: string) => void;
  onOpenNewChat: () => void;
  onOpenNewGroup: () => void;
  onOpenContacts: () => void;
  onOpenProfile?: () => void;
  currentUser: {
    name: string;
    email: string;
    avatar?: string;
    statusMessage?: string;
  };
}

export default function ConversationList({
  conversations,
  selectedId,
  onSelectConversation,
  onOpenNewChat,
  onOpenNewGroup,
  onOpenContacts,
  onOpenProfile,
  currentUser,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
  };

  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter((c) => c.isPinned);
  const regularConversations = filteredConversations.filter((c) => !c.isPinned);

  const formatLastTime = (dateStr?: string | Date) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 3600 * 24));
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" });
    }
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <aside className="w-full md:w-80 lg:w-96 h-full flex flex-col bg-neutral-950/80 backdrop-blur-2xl border-r border-white/10 select-none z-20">
      {/* 1. TOP BAR: TITLE, ACTIONS & SOUND */}
      <div className="p-4 pb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
            <MessageSquare className="w-4 h-4 text-blue-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
            Messages
            <span className="text-[10px] bg-blue-500/20 text-blue-400 font-semibold px-2 py-0.5 rounded-full border border-blue-500/30">
              iOS 18
            </span>
          </h1>
        </div>

        {/* TOP ACTION ICONS */}
        <div className="flex items-center gap-1">
          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
            title={soundEnabled ? "Mute Sounds" : "Enable Sounds"}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-400" />}
          </button>

          {/* Contacts / Friends */}
          <button
            onClick={onOpenContacts}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
            title="Contacts & Connections"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          {/* New Group */}
          <button
            onClick={onOpenNewGroup}
            className="p-2 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
            title="New Group Chat"
          >
            <Users className="w-4 h-4" />
          </button>

          {/* New Direct Chat */}
          <button
            onClick={onOpenNewChat}
            className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-500 shadow-md shadow-blue-500/20 transition-all"
            title="Compose New Message"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-neutral-900/90 border border-white/10 rounded-xl focus-within:border-blue-500/80 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
          <Search className="w-4 h-4 text-neutral-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
        </div>
      </div>

      {/* 3. PINNED CHATS AVATAR ROW */}
      {pinnedConversations.length > 0 && (
        <div className="px-3 pb-2">
          <div className="text-[11px] font-semibold text-neutral-400 mb-2 px-1 flex items-center gap-1">
            <Pin className="w-3 h-3 text-amber-400" />
            <span>PINNED</span>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none">
            {pinnedConversations.map((conv) => (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`flex flex-col items-center gap-1 min-w-[56px] group transition-all ${
                  selectedId === conv._id ? "opacity-100 scale-105" : "opacity-80 hover:opacity-100"
                }`}
              >
                <div className="relative">
                  <img
                    src={conv.icon || getFallbackAvatar(conv.name, conv.type)}
                    alt={conv.name}
                    className={`w-12 h-12 rounded-full object-cover border-2 transition-all ${
                      selectedId === conv._id ? "border-blue-500 shadow-md shadow-blue-500/30" : "border-white/10"
                    }`}
                  />
                  {conv.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                  )}
                  {(conv.unreadCount || 0) > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <span className="text-[11px] text-white/90 truncate max-w-[64px] font-medium group-hover:text-blue-400">
                  {conv.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. CONVERSATION LIST ITEMS */}
      <div className="flex-1 overflow-y-auto px-2 space-y-1 scrollbar-thin">
        {regularConversations.length === 0 && pinnedConversations.length === 0 ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-4 text-neutral-500">
            <MessageSquare className="w-8 h-8 stroke-1 mb-2 opacity-40" />
            <p className="text-xs">No conversations found</p>
            <button
              onClick={onOpenNewChat}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 font-semibold"
            >
              Start a new chat
            </button>
          </div>
        ) : (
          regularConversations.map((conv) => {
            const isSelected = selectedId === conv._id;
            return (
              <button
                key={conv._id}
                onClick={() => onSelectConversation(conv._id)}
                className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                  isSelected
                    ? "bg-blue-600/25 border border-blue-500/40 shadow-lg"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={conv.icon || getFallbackAvatar(conv.name, conv.type)}
                    alt={conv.name}
                    className="w-11 h-11 rounded-full object-cover border border-white/10"
                  />
                  {conv.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-neutral-950" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-sm font-semibold text-white truncate">
                      {conv.name}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono ml-2 flex-shrink-0">
                      {formatLastTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-neutral-400 truncate pr-2">
                      {conv.lastMessage?.text || "No messages yet"}
                    </p>

                    {/* Unread Counter Badge */}
                    {(conv.unreadCount || 0) > 0 && (
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full flex-shrink-0 shadow-sm">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* 5. CURRENT USER FOOTER PILL */}
      <div className="p-3 border-t border-white/10 bg-neutral-900/60 backdrop-blur-xl flex items-center justify-between">
        <div
          onClick={onOpenProfile}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer group hover:opacity-90 transition-all p-1 rounded-xl hover:bg-white/5"
          title="Click to edit Profile & Avatar"
        >
          <div className="relative flex-shrink-0">
            <img
              src={currentUser.avatar || getFallbackAvatar(currentUser.name, "user")}
              alt={currentUser.name}
              className="w-9 h-9 rounded-full object-cover border border-white/15 group-hover:ring-2 group-hover:ring-blue-500 transition-all"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-1 ring-neutral-950" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
              <span>{currentUser.name}</span>
              <Settings className="w-3 h-3 text-neutral-500 group-hover:text-blue-400 transition-colors" />
            </div>
            <div className="text-[10px] text-neutral-400 truncate max-w-[120px]">
              {currentUser.statusMessage || "Active now"}
            </div>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="p-2 rounded-full text-neutral-400 hover:text-red-400 hover:bg-white/10 transition-all"
          title="Sign Out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
