"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Smile, Plus } from "lucide-react";
import { soundEngine } from "@/lib/audio";

interface TapbackMenuProps {
  currentReactions?: Array<{ userId: string; emoji: string }>;
  currentUserId: string;
  onSelectReaction: (emoji: string) => void;
  onClose?: () => void;
  position?: "top" | "bottom";
}

const DEFAULT_TAPBACKS = [
  { emoji: "❤️", label: "Love" },
  { emoji: "👍", label: "Like" },
  { emoji: "👎", label: "Dislike" },
  { emoji: "😂", label: "HaHa" },
  { emoji: "‼️", label: "Emphasis" },
  { emoji: "❓", label: "Question" },
];

const EXTENDED_EMOJIS = [
  "🔥", "🎉", "🥰", "🥺", "✨", "💯", "👏", "🚀", 
  "😎", "😍", "🙌", "💀", "🤩", "🤯", "🥳", "⚡"
];

export default function TapbackMenu({
  currentReactions = [],
  currentUserId,
  onSelectReaction,
  onClose,
  position = "top",
}: TapbackMenuProps) {
  const [showExtended, setShowExtended] = useState(false);

  const myReaction = currentReactions.find((r) => r.userId === currentUserId)?.emoji;

  const handleSelect = (emoji: string) => {
    soundEngine.playTapback();
    onSelectReaction(emoji);
    if (onClose) onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: position === "top" ? 8 : -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: position === "top" ? 8 : -8 }}
      transition={{ type: "spring", damping: 20, stiffness: 350 }}
      className={`absolute ${
        position === "top" ? "bottom-full mb-2" : "top-full mt-2"
      } left-2 z-40`}
    >
      <div className="flex items-center gap-1.5 p-1.5 bg-neutral-900/90 backdrop-blur-2xl border border-white/15 rounded-full shadow-2xl shadow-black/80">
        {DEFAULT_TAPBACKS.map((item, idx) => {
          const isSelected = myReaction === item.emoji;
          return (
            <motion.button
              key={item.emoji}
              whileHover={{ scale: 1.25, y: -2 }}
              whileTap={{ scale: 0.9 }}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              onClick={() => handleSelect(item.emoji)}
              title={item.label}
              className={`w-9 h-9 flex items-center justify-center rounded-full text-xl transition-all ${
                isSelected
                  ? "bg-blue-600/40 border border-blue-400/60 shadow-md shadow-blue-500/30"
                  : "hover:bg-white/10"
              }`}
            >
              {item.emoji}
            </motion.button>
          );
        })}

        <motion.button
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setShowExtended(!showExtended)}
          title="More Emojis"
          className={`w-8 h-8 flex items-center justify-center rounded-full text-neutral-400 hover:text-white transition-all ${
            showExtended ? "bg-white/20 text-white" : "hover:bg-white/10"
          }`}
        >
          <Plus className="w-4 h-4" />
        </motion.button>
      </div>

      {/* Extended Emojis Drawer */}
      <AnimatePresence>
        {showExtended && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            className="absolute left-0 mt-2 p-3 bg-neutral-900/95 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-2xl grid grid-cols-4 gap-2 z-50 w-48"
          >
            {EXTENDED_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleSelect(emoji)}
                className="w-9 h-9 flex items-center justify-center text-xl rounded-xl hover:bg-white/15 hover:scale-115 transition-all"
              >
                {emoji}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
