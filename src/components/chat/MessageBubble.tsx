"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  CheckCheck,
  Reply,
  Edit3,
  Trash2,
  Pin,
  Sparkles,
  FileText,
  Download,
  Copy,
  Info,
} from "lucide-react";
import TapbackMenu from "./TapbackMenu";
import InvisibleInk from "../effects/InvisibleInk";
import VoiceMemoPlayer from "./VoiceMemoPlayer";
import MessageInfoModal from "./MessageInfoModal";
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
  readBy?: Array<{ userId: string; userName?: string; readAt: string | Date }>;
  isRead?: boolean;
  isEdited?: boolean;
  isDeleted?: boolean;
  isPinned?: boolean;
  createdAt: string | Date;
}

interface MessageBubbleComponentProps {
  message: MessageProps;
  currentUserId: string;
  partnerName?: string;
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
  partnerName,
  onReact,
  onReply,
  onEdit,
  onDelete,
  onTogglePin,
  onTriggerEffect,
  showAvatar = true,
}: MessageBubbleComponentProps) {
  const [showTapback, setShowTapback] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);
  const [copied, setCopied] = useState(false);

  const isMe = message.isMe;

  const timeStr = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const groupedReactions = (message.reactions || []).reduce<Record<string, { count: number; userNames: string[] }>>(
    (acc, curr) => {
      if (!acc[curr.emoji]) acc[curr.emoji] = { count: 0, userNames: [] };
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

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const getMotionProps = () => {
    if (message.effect === "slam") {
      return { initial: { scale: 2.5, y: -45, opacity: 0 }, animate: { scale: 1, y: 0, opacity: 1 }, transition: { type: "spring" as const, stiffness: 450, damping: 16 } };
    }
    if (message.effect === "loud") {
      return { initial: { scale: 0.8, opacity: 0 }, animate: { scale: [1, 1.3, 0.95, 1.1, 1], rotate: [0, -3.5, 3.5, -2, 0], opacity: 1 }, transition: { duration: 0.7 } };
    }
    if (message.effect === "gentle") {
      return { initial: { scale: 0.45, opacity: 0, y: 10 }, animate: { scale: 1, opacity: 1, y: 0 }, transition: { duration: 0.8 } };
    }
    return { initial: { opacity: 0, scale: 0.97, y: 4 }, animate: { opacity: 1, scale: 1, y: 0 }, transition: { duration: 0.15 } };
  };

  const motionProps = getMotionProps();

  return (
    <>
      <div id={`chat-msg-${message._id}`} className={`relative flex flex-col select-none ${isMe ? "items-end pr-2 sm:pr-3 pl-8 sm:pl-16" : "items-start pl-2 sm:pl-3 pr-8 sm:pr-16"}`}>
        {message.isPinned && (
          <div className="flex items-center gap-1 text-[10px] text-amber-400/90 mb-1 px-1 font-medium">
            <Pin className="w-3 h-3 fill-current" />
            <span>Pinned</span>
          </div>
        )}

        <div className={`flex items-end gap-2 max-w-[88%] sm:max-w-md md:max-w-lg lg:max-w-xl ${isMe ? "flex-row-reverse" : "flex-row"}`}>
          {!isMe && showAvatar && (
            <img
              src={message.senderAvatar || getFallbackAvatar(message.senderName, "user")}
              alt={message.senderName}
              className="w-7 h-7 rounded-full object-cover border border-white/10 shadow-sm flex-shrink-0 mb-1"
            />
          )}

          <div className="relative group">
            {/* TAPBACK REACTION POPUP */}
            <AnimatePresence>
              {showTapback && (
                <TapbackMenu
                  currentReactions={message.reactions || []}
                  currentUserId={currentUserId}
                  isMe={isMe}
                  onSelectReaction={(emoji) => { onReact(message._id, emoji); setShowTapback(false); }}
                  onClose={() => setShowTapback(false)}
                />
              )}
            </AnimatePresence>

            {/* REPLY QUOTE PREVIEW */}
            {message.replyTo && (
              <div
                className={`mb-1.5 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] max-w-full cursor-pointer ${
                  isMe
                    ? "bg-blue-900/50 border-blue-300/30 text-blue-100"
                    : "bg-white/[0.06] border-white/10 text-slate-300"
                }`}
              >
                <Reply className="w-3.5 h-3.5 flex-shrink-0 text-blue-400" />
                {message.replyTo.senderName && <span className="font-bold">{message.replyTo.senderName}:</span>}
                <span className="truncate">{message.replyTo.text || "[Media Attachment]"}</span>
              </div>
            )}

            {/* MAIN MESSAGE BUBBLE */}
            <motion.div
              initial={motionProps.initial}
              animate={motionProps.animate}
              transition={motionProps.transition}
              onContextMenu={(e) => { e.preventDefault(); setShowTapback(true); }}
              onClick={() => setShowActions((v) => !v)}
              className={`relative min-w-[130px] max-w-full rounded-2xl px-3.5 py-2.5 sm:px-4 sm:py-3 text-xs shadow-md select-none touch-pan-y cursor-pointer ${
                message.isDeleted
                  ? "bg-white/[0.04] text-slate-400 italic border border-white/5"
                  : isMe
                  ? "bg-[#007AFF] text-white border border-blue-400/20 rounded-tr-xs"
                  : "bg-[#1C1C1E] border border-white/10 text-slate-100 rounded-tl-xs"
              }`}
            >
              {/* Sender Name Header - moved right with pl-1.5 */}
              {!message.isDeleted && (
                <div className="flex items-center justify-between gap-2 mb-1 pl-1.5 pr-1">
                  <span className={`text-[10.5px] font-bold tracking-wide ${isMe ? "text-blue-100" : "text-blue-400"}`}>
                    {message.senderName || "Member"}
                  </span>
                </div>
              )}

              {message.isDeleted ? (
                <span className="text-slate-400 italic text-xs pl-1.5">This message was deleted</span>
              ) : isEditing ? (
                <div className="space-y-1.5 my-1" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveEdit()}
                    className="w-full bg-white/15 border border-white/30 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-white"
                    autoFocus
                  />
                  <div className="flex gap-1.5 justify-end">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-2.5 py-1 text-[10px] bg-white/15 hover:bg-white/25 rounded-lg text-white cursor-pointer">Cancel</button>
                    <button type="button" onClick={handleSaveEdit} className="px-2.5 py-1 text-[10px] bg-white text-blue-600 rounded-lg font-bold cursor-pointer hover:bg-white/90">Save</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  {message.mediaType === "image" && message.mediaData && (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 mb-1.5">
                      <img src={message.mediaData} alt={message.mediaName || "Photo"} className="w-full max-h-72 object-cover rounded-xl hover:scale-[1.01] transition-transform cursor-pointer" />
                    </div>
                  )}
                  {message.mediaType === "video" && message.mediaData && (
                    <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40 mb-1.5">
                      <video src={message.mediaData} controls className="w-full max-h-72 rounded-xl" />
                    </div>
                  )}
                  {message.mediaType === "audio" && message.mediaData && (
                    <VoiceMemoPlayer audioSrc={message.mediaData} durationSec={message.audioDuration || 0} isMe={isMe} />
                  )}
                  {message.mediaType === "file" && (
                    <a href={message.mediaData || "#"} download={message.mediaName || "attachment"} onClick={(e) => e.stopPropagation()} className={`flex items-center gap-2.5 p-2 rounded-xl transition-all ${isMe ? "bg-white/15 hover:bg-white/25 text-white" : "bg-black/40 hover:bg-black/60 text-slate-200"}`}>
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-white" /></div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-xs font-semibold truncate">{message.mediaName || "Document"}</div>
                        <div className="text-[10px] opacity-75 font-mono">{message.mediaSize || "File"}</div>
                      </div>
                      <Download className="w-4 h-4 opacity-80 hover:opacity-100 ml-1" />
                    </a>
                  )}
                  {/* Message text - moved right with pl-1.5 */}
                  {message.text && (
                    message.effect === "invisible_ink" ? (
                      <InvisibleInk>
                        <div className="pl-1.5 pr-1 my-0.5">
                          <p className="whitespace-pre-wrap break-words leading-relaxed text-[13px] sm:text-[13.5px] font-normal text-white">{message.text}</p>
                        </div>
                      </InvisibleInk>
                    ) : (
                      <div className="pl-1.5 pr-1 my-0.5">
                        <p className="whitespace-pre-wrap break-words leading-relaxed text-[13px] sm:text-[13.5px] font-normal text-white">{message.text}</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* EFFECT BADGE */}
              {!message.isDeleted && message.effect && message.effect !== "invisible_ink" && (
                <div className="mt-1.5 mb-0.5 pl-1.5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onTriggerEffect && onTriggerEffect(message.effect); }}
                    className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                      isMe
                        ? "bg-white/20 hover:bg-white/30 text-white border border-white/20"
                        : "bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10"
                    }`}
                    title="Replay Effect"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span className="capitalize">{message.effect.replace("_", " ")}</span>
                  </button>
                </div>
              )}

              {/* TIMESTAMP & TICK STATUS */}
              <div className={`flex items-center justify-end gap-1.5 mt-1 pt-0.5 text-[9.5px] select-none font-mono ${isMe ? "text-blue-100/80" : "text-slate-400"}`}>
                {message.isEdited && <span className="opacity-70 italic text-[8px] mr-0.5">(edited)</span>}
                <span>{timeStr}</span>
                {isMe && !message.isDeleted && (
                  <span className={message.isRead ? "text-white font-bold ml-0.5" : "text-blue-200/70 ml-0.5"}>
                    <CheckCheck className="w-3.5 h-3.5 inline" />
                  </span>
                )}
              </div>

              {/* REACTIONS ATTACHED TO BUBBLE */}
              {Object.keys(groupedReactions).length > 0 && (
                <div
                  onClick={(e) => { e.stopPropagation(); setShowTapback(true); }}
                  className={`absolute -bottom-3 z-10 cursor-pointer select-none flex items-center gap-0.5 px-2 py-0.5 bg-[#1C1C1E] border border-white/20 rounded-full shadow-lg ${isMe ? "right-2" : "left-2"}`}
                >
                  {Object.entries(groupedReactions).map(([emoji, data]) => (
                    <span key={emoji} className="text-xs flex items-center leading-none" title={data.userNames.join(", ")}>
                      {emoji}{data.count > 1 && <span className="text-[9px] font-bold ml-0.5 text-blue-400">{data.count}</span>}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>

            {/* ACTION BAR - below bubble, tap on mobile */}
            <AnimatePresence>
              {showActions && !message.isDeleted && (
                <motion.div
                  initial={{ opacity: 0, y: -4, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  transition={{ duration: 0.12 }}
                  onClick={(e) => e.stopPropagation()}
                  className={`mt-2 flex items-center gap-1 p-1 rounded-2xl bg-[#141420]/95 border border-white/15 shadow-2xl backdrop-blur-xl z-20 md:hidden ${isMe ? "justify-end" : "justify-start"}`}
                >
                  <button type="button" onClick={() => { onReply(message); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                  <button type="button" onClick={handleCopy} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title={copied ? "Copied!" : "Copy"}><Copy className={`w-3.5 h-3.5 ${copied ? "text-blue-400" : ""}`} /></button>
                  <button type="button" onClick={() => { setShowTapback(true); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="React"><Sparkles className="w-3.5 h-3.5 text-amber-400" /></button>
                  <button type="button" onClick={() => { setShowInfoModal(true); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-blue-400 hover:bg-white/10 transition-all cursor-pointer" title="Message Info"><Info className="w-3.5 h-3.5 text-blue-400" /></button>
                  {isMe && <button type="button" onClick={() => { setIsEditing(true); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>}
                  <button type="button" onClick={() => { onTogglePin(message._id, !message.isPinned); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-all cursor-pointer" title={message.isPinned ? "Unpin" : "Pin"}><Pin className="w-3.5 h-3.5" /></button>
                  {isMe && <button type="button" onClick={() => { onDelete(message._id); setShowActions(false); }} className="p-1.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop: hover action bar to the side */}
            {!message.isDeleted && (
              <div
                onClick={(e) => e.stopPropagation()}
                className={`hidden md:flex absolute top-1.5 ${isMe ? "-left-2 -translate-x-full" : "-right-2 translate-x-full"} opacity-0 group-hover:opacity-100 transition-all items-center gap-0.5 bg-[#141420]/90 backdrop-blur-xl border border-white/15 p-1 rounded-2xl shadow-2xl z-20`}
              >
                <button type="button" onClick={() => setShowTapback(!showTapback)} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="React"><Sparkles className="w-3.5 h-3.5 text-amber-400" /></button>
                <button type="button" onClick={() => onReply(message)} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="Reply"><Reply className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={handleCopy} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title={copied ? "Copied!" : "Copy"}><Copy className={`w-3.5 h-3.5 ${copied ? "text-blue-400" : ""}`} /></button>
                <button type="button" onClick={() => setShowInfoModal(true)} className="p-1.5 rounded-xl text-slate-300 hover:text-blue-400 hover:bg-white/10 transition-all cursor-pointer" title="Message Info"><Info className="w-3.5 h-3.5 text-blue-400" /></button>
                {isMe && <button type="button" onClick={() => setIsEditing(true)} className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-all cursor-pointer" title="Edit"><Edit3 className="w-3.5 h-3.5" /></button>}
                <button type="button" onClick={() => onTogglePin(message._id, !message.isPinned)} className="p-1.5 rounded-xl text-slate-300 hover:text-amber-400 hover:bg-white/10 transition-all cursor-pointer" title={message.isPinned ? "Unpin" : "Pin"}><Pin className="w-3.5 h-3.5" /></button>
                {isMe && <button type="button" onClick={() => onDelete(message._id)} className="p-1.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MESSAGE INFO MODAL */}
      <MessageInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        message={message}
        partnerName={partnerName}
      />
    </>
  );
}
