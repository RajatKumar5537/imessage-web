"use client";

import React, { useState } from "react";
import {
  X,
  Phone,
  Video,
  Search,
  Clock,
  Trash2,
  Image as ImageIcon,
  Mic,
  FileText,
  Shield,
  Bell,
  BellOff,
  UserX,
  Mail,
  Calendar,
  Sparkles,
  Download,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import VoiceMemoPlayer from "./VoiceMemoPlayer";
import { getFallbackAvatar } from "@/lib/avatars";

interface ContactProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
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
  messages: any[];
  onStartAudioCall: () => void;
  onStartVideoCall: () => void;
  onOpenSearch: () => void;
  onClearChat: () => void;
  onSetDisappearingTimer: (hours: number) => void;
}

export default function ContactProfileModal({
  isOpen,
  onClose,
  conversation,
  messages,
  onStartAudioCall,
  onStartVideoCall,
  onOpenSearch,
  onClearChat,
  onSetDisappearingTimer,
}: ContactProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"media" | "audio" | "docs" | "settings">("media");
  const [isMuted, setIsMuted] = useState(false);

  if (!isOpen) return null;

  // Filter shared media
  const photoVideos = messages.filter(
    (m) => (m.mediaType === "image" || m.mediaType === "video") && m.mediaData && !m.isDeleted
  );
  const audioNotes = messages.filter(
    (m) => m.mediaType === "audio" && m.mediaData && !m.isDeleted
  );
  const documents = messages.filter(
    (m) => m.mediaType === "file" && !m.isDeleted
  );

  const timerOptions = [
    { hours: 0, label: "Off" },
    { hours: 1 / 60, label: "1 Minute" },
    { hours: 1, label: "1 Hour" },
    { hours: 24, label: "24 Hours" },
    { hours: 168, label: "7 Days" },
  ];

  const peer = conversation.participantDetails?.[0];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg bg-neutral-900/95 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90dvh]"
        >
          {/* Header Bar with Close */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-white/10 bg-white/[0.03] flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                {conversation.type === "group" ? "Group Details" : "Contact Profile"}
              </h2>
              <p className="text-xs text-neutral-400">Media, voice notes & conversation settings</p>
            </div>
            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all border border-white/20 shadow-md flex-shrink-0 cursor-pointer"
              title="Close"
            >
              <X className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {/* Contact Avatar & Bio Header */}
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-3">
                <img
                  src={conversation.icon || getFallbackAvatar(conversation.name, conversation.type)}
                  alt={conversation.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-white/15 shadow-xl"
                />
                {conversation.type === "direct" && conversation.isOnline && (
                  <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-3 border-neutral-900" />
                )}
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">{conversation.name}</h2>
              {conversation.type === "direct" && peer?.email && (
                <p className="text-xs text-neutral-400 mt-0.5 flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{peer.email}</span>
                </p>
              )}

              {/* Status / Bio */}
              <div className="mt-2 px-3 py-1 bg-neutral-800/80 border border-white/10 rounded-full text-xs text-neutral-300">
                {peer?.statusMessage || (conversation.isOnline ? "Active now" : "Available")}
              </div>

              {/* Quick Action Shortcuts */}
              <div className="flex items-center gap-3 mt-4">
                <button
                  onClick={() => {
                    onClose();
                    onStartAudioCall();
                  }}
                  className="flex flex-col items-center gap-1 p-2.5 px-4 rounded-2xl bg-neutral-800 hover:bg-blue-600/30 text-blue-400 border border-white/10 transition-all"
                >
                  <Phone className="w-4 h-4" />
                  <span className="text-[11px] font-medium text-white">Audio</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onStartVideoCall();
                  }}
                  className="flex flex-col items-center gap-1 p-2.5 px-4 rounded-2xl bg-neutral-800 hover:bg-blue-600/30 text-blue-400 border border-white/10 transition-all"
                >
                  <Video className="w-4 h-4" />
                  <span className="text-[11px] font-medium text-white">FaceTime</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onOpenSearch();
                  }}
                  className="flex flex-col items-center gap-1 p-2.5 px-4 rounded-2xl bg-neutral-800 hover:bg-white/10 text-neutral-300 border border-white/10 transition-all"
                >
                  <Search className="w-4 h-4" />
                  <span className="text-[11px] font-medium text-white">Search</span>
                </button>

                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex flex-col items-center gap-1 p-2.5 px-4 rounded-2xl border transition-all ${
                    isMuted
                      ? "bg-amber-500/20 border-amber-500/40 text-amber-300"
                      : "bg-neutral-800 border-white/10 text-neutral-300 hover:bg-white/10"
                  }`}
                >
                  {isMuted ? <BellOff className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  <span className="text-[11px] font-medium text-white">{isMuted ? "Muted" : "Mute"}</span>
                </button>
              </div>
            </div>

            {/* Content Tabs Navigation */}
            <div className="flex items-center gap-1 p-1 bg-neutral-800/80 rounded-2xl border border-white/10">
              <button
                onClick={() => setActiveTab("media")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === "media" ? "bg-blue-600 text-white shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                Photos ({photoVideos.length})
              </button>
              <button
                onClick={() => setActiveTab("audio")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === "audio" ? "bg-blue-600 text-white shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                Voice ({audioNotes.length})
              </button>
              <button
                onClick={() => setActiveTab("docs")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === "docs" ? "bg-blue-600 text-white shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                Files ({documents.length})
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                  activeTab === "settings" ? "bg-blue-600 text-white shadow" : "text-neutral-400 hover:text-white"
                }`}
              >
                Privacy
              </button>
            </div>

            {/* TAB: MEDIA GALLERY */}
            {activeTab === "media" && (
              <div className="min-h-[160px]">
                {photoVideos.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 text-xs flex flex-col items-center gap-1">
                    <ImageIcon className="w-6 h-6 text-neutral-600" />
                    <span>No photos or videos exchanged yet</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {photoVideos.map((m) => (
                      <div key={m._id} className="relative aspect-square rounded-xl overflow-hidden bg-neutral-800">
                        {m.mediaType === "video" ? (
                          <video src={m.mediaData} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={m.mediaData}
                            alt={m.mediaName || "Media"}
                            className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: VOICE NOTES */}
            {activeTab === "audio" && (
              <div className="min-h-[160px] space-y-2">
                {audioNotes.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 text-xs flex flex-col items-center gap-1">
                    <Mic className="w-6 h-6 text-neutral-600" />
                    <span>No audio voice notes recorded in this chat</span>
                  </div>
                ) : (
                  audioNotes.map((m) => (
                    <div key={m._id} className="p-2.5 rounded-2xl bg-neutral-800/60 border border-white/10 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="text-[11px] text-neutral-400 mb-1">
                          {m.senderName} • {new Date(m.createdAt).toLocaleDateString()}
                        </div>
                        <VoiceMemoPlayer audioSrc={m.mediaData} durationSec={m.audioDuration} isMe={false} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB: DOCUMENTS */}
            {activeTab === "docs" && (
              <div className="min-h-[160px] space-y-2">
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500 text-xs flex flex-col items-center gap-1">
                    <FileText className="w-6 h-6 text-neutral-600" />
                    <span>No files or documents shared yet</span>
                  </div>
                ) : (
                  documents.map((m) => (
                    <a
                      key={m._id}
                      href={m.mediaData || "#"}
                      download={m.mediaName || "document"}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-neutral-800/60 hover:bg-neutral-800 border border-white/10 transition-all text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-white truncate">{m.mediaName || "Document"}</div>
                          <div className="text-[10px] text-neutral-400">{m.mediaSize || "File"}</div>
                        </div>
                      </div>
                      <Download className="w-4 h-4 text-neutral-400 hover:text-white" />
                    </a>
                  ))
                )}
              </div>
            )}

            {/* TAB: PRIVACY & SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-4">
                {/* Disappearing Timer */}
                <div className="p-3 bg-neutral-800/60 rounded-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold text-white">Disappearing Messages</span>
                    </div>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      {conversation.disappearingHours && conversation.disappearingHours > 0
                        ? `${conversation.disappearingHours}h`
                        : "Off"}
                    </span>
                  </div>
                  <div className="grid grid-cols-5 gap-1">
                    {timerOptions.map((opt) => (
                      <button
                        key={opt.hours}
                        type="button"
                        onClick={() => onSetDisappearingTimer(opt.hours)}
                        className={`py-1 text-[11px] font-semibold rounded-lg transition-all ${
                          conversation.disappearingHours === opt.hours
                            ? "bg-blue-600 text-white shadow"
                            : "bg-neutral-900/80 hover:bg-white/10 text-neutral-300"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Encryption Info */}
                <div className="flex items-center gap-3 p-3 bg-neutral-800/40 rounded-2xl border border-white/10 text-xs text-neutral-300">
                  <Shield className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-white block">End-to-End Encrypted</span>
                    <span className="text-[11px] text-neutral-400">
                      Messages and calls are secured with AES-256-GCM encryption.
                    </span>
                  </div>
                </div>

                {/* Clear Chat */}
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onClearChat();
                  }}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-2xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-xs font-semibold text-red-400 transition-all cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Conversation History</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
