"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCheck,
  MoreHorizontal,
  Reply,
  Edit3,
  Trash2,
  Pin,
  Sparkles,
  Flame,
  FileText,
  Download,
} from "lucide-react";
import TapbackMenu from "./TapbackMenu";
import InvisibleInk from "../effects/InvisibleInk";
import VoiceMemoPlayer from "./VoiceMemoPlayer";
import { getFallbackAvatar } from "@/lib/avatars";

interface ReactionItem {
  userId: string;
  userName: string;
  emoji: string;
}

export interface MessageProps {
  _id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isMe: boolean;
  text: string;
  effect?: "fireworks" | "balloons" | "confetti" | "lasers" | "love" | "shooting_star" | "invisible_ink" | "slam" | "loud" | "gentle" | null;
  mediaType?: "image" | "video" | "audio" | "file" | null;
  mediaData?: string | null;
  mediaName?: string | null;
  mediaSize?: string | null;
  audioDuration?: number;
  reactions?: ReactionItem[];
  replyTo?: { id: string; senderName: string; text: string; mediaType?: string } | null;
  readBy?: Array<{ userId: string; readAt: Date }>;
  isRead?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  createdAt: string | Date;
}

interface MessageBubbleComponentProps {
  message: MessageProps;
  currentUserId: string;
  onReact: (messageId: string, emoji: string) => void;
  onReply: (message: MessageProps) => void;
  onEdit: (message: MessageProps) => void;
  onDelete: (messageId: string) => void;
  onTogglePin: (messageId: string, isPinned: boolean) => void;
  onTriggerEffect?: (effectName: any) => void;
  showAvatar?: boolean;
}

export default function MessageBubble({
  message,
  currentUserId,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onTriggerEffect,
  showAvatar = true,
}: MessageBubbleComponentProps) {
  const [showTapback, setShowTapback] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const isMe = message.isMe;

  // Format time
  const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // Group reactions by emoji
  const groupedReactions = (message.reactions || []).reduce<Record<string, { count: number; userNames: string[] }>>(
    (acc, curr) => {
      if (!acc[curr.emoji]) {
        acc[curr.emoji] = { count: 0, userNames: [] };
      }
      acc[curr.emoji].count += 1;
      acc[curr.emoji].userNames.push(curr.userName);
      return acc;
    },
    {}
  );

  const handleSaveEdit = () => {
    if (editText.trim() && editText !== message.text) {
      onEdit({ ...message, text: editText.trim() });
    }
    setIsEditing(false);
  };

  return (
    <div
      className={`relative group flex flex-col my-1 px-2 ${
        isMe ? "items-end" : "items-start"
      }`}
    >
      {/* Pinned Indicator */}
      {message.isPinned && (
        <div className="flex items-center gap-1 text-[10px] text-amber-400/80 mb-0.5 px-2 font-medium">
          <Pin className="w-3 h-3 fill-current" />
          <span>Pinned Message</span>
        </div>
      )}

      <div className={`flex items-end gap-2 max-w-[85%] md:max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar for others in group */}
        {!isMe && showAvatar && (
          <img
            src={message.senderAvatar || getFallbackAvatar(message.senderName, "user")}
            alt={message.senderName}
            className="w-7 h-7 rounded-full object-cover border border-white/10 shadow-sm flex-shrink-0 mb-1"
          />
        )}

        {/* Message Container */}
        <div className="relative">
          {/* SENDER NAME IN GROUP */}
          {!isMe && message.senderName && (
            <div className="text-[11px] font-medium text-neutral-400 ml-3 mb-0.5">
              {message.senderName}
            </div>
          )}

          {/* TAPBACK FLOATING MENU */}
          <AnimatePresence>
            {showTapback && (
              <TapbackMenu
                currentReactions={message.reactions || []}
                currentUserId={currentUserId}
                onSelectReaction={(emoji) => {
                  onReact(message._id, emoji);
                  setShowTapback(false);
                }}
                onClose={() => setShowTapback(false)}
              />
            )}
          </AnimatePresence>

          {/* BUBBLE CONTENT */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onContextMenu={(e) => {
              e.preventDefault();
              setShowTapback(true);
            }}
            className={`relative rounded-2xl px-3.5 py-2.5 shadow-md transition-all ${
              message.isDeleted
                ? "bg-neutral-800/60 text-neutral-400 italic text-xs border border-white/5"
                : isMe
                ? "bg-[#007AFF] text-white rounded-br-xs shadow-blue-500/20"
                : "bg-[#26252A]/90 text-white rounded-bl-xs border border-white/10 backdrop-blur-2xl shadow-black/40"
            }`}
          >
            {/* QUOTE REPLY PREVIEW */}
            {message.replyTo && (
              <div
                className={`mb-1.5 p-1.5 px-2.5 rounded-xl text-xs border-l-3 ${
                  isMe
                    ? "bg-blue-800/40 border-white/80 text-white/90"
                    : "bg-black/30 border-blue-400 text-neutral-300"
                }`}
              >
                <div className="font-semibold text-[11px] opacity-90">{message.replyTo.senderName}</div>
                <div className="truncate text-[11px] opacity-75">{message.replyTo.text || "[Media Attachment]"}</div>
              </div>
            )}

            {/* DELETED MESSAGE */}
            {message.isDeleted ? (
              <span>This message was deleted</span>
            ) : isEditing ? (
              /* INLINE EDIT */
              <div className="flex flex-col gap-1.5">
                <input
                  type="text"
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                  className="bg-black/30 text-white text-sm rounded-lg px-2 py-1 outline-none border border-white/20"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2 text-[10px]">
                  <button onClick={() => setIsEditing(false)} className="opacity-70 hover:underline">Cancel</button>
                  <button onClick={handleSaveEdit} className="font-bold underline">Save</button>
                </div>
              </div>
            ) : (
              /* ACTIVE MESSAGE BODY */
              <div>
                {/* 1. MEDIA: PHOTO / VIDEO */}
                {message.mediaType === "image" && message.mediaData && (
                  <div className="mb-1 rounded-xl overflow-hidden max-w-sm">
                    <img
                      src={message.mediaData}
                      alt={message.mediaName || "Photo"}
                      className="w-full max-h-72 object-cover rounded-xl hover:scale-102 transition-transform cursor-pointer"
                    />
                  </div>
                )}
                {message.mediaType === "video" && message.mediaData && (
                  <div className="mb-1 rounded-xl overflow-hidden max-w-sm">
                    <video
                      src={message.mediaData}
                      controls
                      className="w-full max-h-72 rounded-xl"
                    />
                  </div>
                )}

                {/* 2. MEDIA: AUDIO VOICE MEMO */}
                {message.mediaType === "audio" && message.mediaData && (
                  <VoiceMemoPlayer
                    audioSrc={message.mediaData}
                    durationSec={message.audioDuration || 0}
                    isMe={isMe}
                  />
                )}

                {/* 3. MEDIA: DOCUMENT FILE */}
                {message.mediaType === "file" && (
                  <a
                    href={message.mediaData || "#"}
                    download={message.mediaName || "attachment"}
                    className={`flex items-center gap-2.5 p-2 rounded-xl mb-1 transition-all ${
                      isMe ? "bg-blue-800/40 hover:bg-blue-800/60" : "bg-black/30 hover:bg-black/50"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-xs font-semibold truncate">{message.mediaName || "Document"}</div>
                      <div className="text-[10px] opacity-70">{message.mediaSize || "File"}</div>
                    </div>
                    <Download className="w-4 h-4 opacity-70 hover:opacity-100 ml-1" />
                  </a>
                )}

                {/* 4. TEXT CONTENT WITH INVISIBLE INK OPTION */}
                {message.text && (
                  message.effect === "invisible_ink" ? (
                    <InvisibleInk>
                      <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                        {message.text}
                      </p>
                    </InvisibleInk>
                  ) : (
                    <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
                      {message.text}
                    </p>
                  )
                )}
              </div>
            )}

            {/* EFFECT REPLAY BADGE */}
            {message.effect && message.effect !== "invisible_ink" && (
              <button
                type="button"
                onClick={() => onTriggerEffect && onTriggerEffect(message.effect)}
                className={`mt-1 inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full transition-all ${
                  isMe
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30"
                }`}
                title="Replay Effect Animation"
              >
                <Sparkles className="w-3 h-3" />
                <span className="capitalize">{message.effect} Effect</span>
              </button>
            )}

            {/* FOOTER: TIME & DELIVERY TICK */}
            <div
              className={`flex items-center gap-1 mt-1 text-[10px] select-none ${
                isMe ? "text-blue-100 justify-end" : "text-neutral-400 justify-end"
              }`}
            >
              {message.isEdited && <span className="opacity-70">(edited)</span>}
              <span>{timeStr}</span>

              {/* iOS Delivery Receipts */}
              {isMe && !message.isDeleted && (
                <span>
                  {message.isRead ? (
                    <CheckCheck className="w-3.5 h-3.5 text-blue-200 inline" />
                  ) : (
                    <Check className="w-3 h-3 text-white/70 inline" />
                  )}
                </span>
              )}
            </div>

            {/* DOCKED TAPBACK REACTIONS BADGE */}
            {Object.keys(groupedReactions).length > 0 && (
              <div
                onClick={() => setShowTapback(true)}
                className={`absolute -bottom-3 cursor-pointer select-none flex items-center gap-0.5 px-1.5 py-0.5 bg-neutral-900/90 backdrop-blur-xl border border-white/20 rounded-full shadow-lg ${
                  isMe ? "right-2" : "left-2"
                }`}
              >
                {Object.entries(groupedReactions).map(([emoji, data]) => (
                  <span key={emoji} className="text-xs flex items-center" title={data.userNames.join(", ")}>
                    {emoji}
                    {data.count > 1 && (
                      <span className="text-[9px] font-bold ml-0.5 text-neutral-300">
                        {data.count}
                      </span>
                    )}
                  </span>
                ))}
              </div>
            )}
          </motion.div>

          {/* HOVER QUICK ACTIONS BAR (DESKTOP ONLY) */}
          <div
            className={`hidden md:flex absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity items-center gap-1 ${
              isMe ? "-left-16" : "-right-16"
            }`}
          >
            <button
              onClick={() => setShowTapback(!showTapback)}
              className="p-1 rounded-full bg-neutral-800/90 text-neutral-300 hover:text-white border border-white/10 hover:bg-neutral-700 transition-all"
              title="React"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => onReply(message)}
              className="p-1 rounded-full bg-neutral-800/90 text-neutral-300 hover:text-white border border-white/10 hover:bg-neutral-700 transition-all"
              title="Reply in thread"
            >
              <Reply className="w-3.5 h-3.5" />
            </button>

            {isMe && !message.isDeleted && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-1 rounded-full bg-neutral-800/90 text-neutral-300 hover:text-white border border-white/10 hover:bg-neutral-700 transition-all"
                title="Edit message"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => onTogglePin(message._id, !message.isPinned)}
              className="p-1 rounded-full bg-neutral-800/90 text-neutral-300 hover:text-amber-400 border border-white/10 hover:bg-neutral-700 transition-all"
              title={message.isPinned ? "Unpin message" : "Pin message"}
            >
              <Pin className="w-3.5 h-3.5" />
            </button>

            {isMe && !message.isDeleted && (
              <button
                onClick={() => onDelete(message._id)}
                className="p-1 rounded-full bg-neutral-800/90 text-neutral-300 hover:text-red-400 border border-white/10 hover:bg-neutral-700 transition-all"
                title="Delete for everyone"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
