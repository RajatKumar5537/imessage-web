"use client";

import React, { useState, useRef } from "react";
import { Plus, Mic, ArrowUp, X, Sparkles } from "lucide-react";
import ActionDrawer from "./ActionDrawer";
import VoiceMemoRecorder from "./VoiceMemoRecorder";
import { soundEngine } from "@/lib/audio";

interface MessageInputBarProps {
  onSendMessage: (data: {
    text: string;
    effect?: string | null;
    mediaType?: "image" | "video" | "audio" | "file" | null;
    mediaData?: string | null;
    mediaName?: string | null;
    mediaSize?: string | null;
    audioDuration?: number;
    replyTo?: any;
  }) => void;
  replyTo?: any;
  onClearReply?: () => void;
  onTyping?: (isTyping: boolean) => void;
  currentDisappearingHours?: number;
  onSetDisappearingTimer?: (hours: number) => void;
}

export default function MessageInputBar({
  onSendMessage,
  replyTo,
  onClearReply,
  onTyping,
  currentDisappearingHours = 0,
  onSetDisappearingTimer = () => {},
}: MessageInputBarProps) {
  const [text, setText] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [selectedEffect, setSelectedEffect] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<any>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value);

    // Typing debounce
    if (onTyping) {
      onTyping(true);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        onTyping(false);
      }, 2000);
    }
  };

  const handleSend = () => {
    if (!text.trim()) return;

    soundEngine.playSent();

    onSendMessage({
      text: text.trim(),
      effect: selectedEffect,
      replyTo: replyTo || null,
    });

    setText("");
    setSelectedEffect(null);
    if (onClearReply) onClearReply();
    if (onTyping) onTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Media file handlers
  const handleSelectPhoto = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const isVideo = file.type.startsWith("video");
      soundEngine.playSent();
      onSendMessage({
        text: text.trim(),
        effect: selectedEffect,
        mediaType: isVideo ? "video" : "image",
        mediaData: reader.result as string,
        mediaName: file.name,
        mediaSize: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
        replyTo: replyTo || null,
      });
      setText("");
      setSelectedEffect(null);
      if (onClearReply) onClearReply();
    };
    reader.readAsDataURL(file);
  };

  const handleSelectFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      soundEngine.playSent();
      onSendMessage({
        text: text.trim(),
        effect: selectedEffect,
        mediaType: "file",
        mediaData: reader.result as string,
        mediaName: file.name,
        mediaSize: `${(file.size / 1024).toFixed(0)} KB`,
        replyTo: replyTo || null,
      });
      setText("");
      setSelectedEffect(null);
      if (onClearReply) onClearReply();
    };
    reader.readAsDataURL(file);
  };

  const handleSendVoiceMemo = (base64Audio: string, durationSec: number) => {
    soundEngine.playSent();
    onSendMessage({
      text: "",
      effect: selectedEffect,
      mediaType: "audio",
      mediaData: base64Audio,
      audioDuration: durationSec,
      replyTo: replyTo || null,
    });
    setIsRecordingVoice(false);
    setSelectedEffect(null);
    if (onClearReply) onClearReply();
  };

  return (
    <footer className="relative z-30 p-2 md:p-3 bg-neutral-900/90 backdrop-blur-2xl border-t border-white/10">
      {/* 1. REPLY BANNER */}
      {replyTo && (
        <div className="flex items-center justify-between p-2 mb-2 bg-neutral-800/80 border border-white/10 rounded-2xl text-xs backdrop-blur-xl">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-1 h-6 bg-blue-500 rounded-full" />
            <div className="truncate">
              <span className="font-semibold text-blue-400">{replyTo.senderName}: </span>
              <span className="text-neutral-300">{replyTo.text || "[Media Attachment]"}</span>
            </div>
          </div>
          <button
            onClick={onClearReply}
            className="p-1 rounded-full text-neutral-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. EFFECT ACTIVE BADGE */}
      {selectedEffect && (
        <div className="flex items-center justify-between px-3 py-1 mb-1.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-xs text-amber-300">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sending with <strong>{selectedEffect}</strong> effect</span>
          </div>
          <button
            onClick={() => setSelectedEffect(null)}
            className="text-neutral-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. VOICE RECORDING MODE */}
      {isRecordingVoice ? (
        <VoiceMemoRecorder
          onSendVoiceMemo={handleSendVoiceMemo}
          onCancel={() => setIsRecordingVoice(false)}
        />
      ) : (
        /* 4. MAIN INPUT ROW (MATCHING SCREENSHOT #2) */
        <div className="flex items-center gap-2">
          {/* '+' EXPAND BUTTON */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-white/10 transition-all shadow-md active:scale-95"
              title="Add Media, Effects & Apps"
            >
              <Plus className="w-5 h-5" />
            </button>

            <ActionDrawer
              isOpen={isDrawerOpen}
              onClose={() => setIsDrawerOpen(false)}
              onSelectPhoto={handleSelectPhoto}
              onStartVoiceMemo={() => setIsRecordingVoice(true)}
              onSelectEffect={(eff) => setSelectedEffect(eff)}
              onSelectFile={handleSelectFile}
              onSetDisappearingTimer={onSetDisappearingTimer}
              currentDisappearingHours={currentDisappearingHours}
              selectedEffect={selectedEffect}
            />
          </div>

          {/* INPUT PILL */}
          <div className="flex-1 flex items-center bg-neutral-800/80 border border-white/10 rounded-3xl px-4 py-2 focus-within:border-blue-500/60 focus-within:bg-neutral-800 transition-all shadow-inner">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="iMessage • Text Message"
              className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-neutral-500"
            />

            {/* SEND / MIC TOGGLE */}
            {text.trim() ? (
              <button
                type="button"
                onClick={handleSend}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/30 transition-all active:scale-90"
                title="Send Message"
              >
                <ArrowUp className="w-4 h-4 stroke-[3]" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsRecordingVoice(true)}
                className="p-1 rounded-full text-neutral-400 hover:text-white transition-all active:scale-90"
                title="Record Audio Message"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </footer>
  );
}
