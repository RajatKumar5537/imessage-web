"use client";

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Maximize2 } from "lucide-react";

interface MediaViewerModalProps {
  isOpen: boolean;
  mediaType: "image" | "video";
  mediaData: string;
  mediaName?: string | null;
  mediaSize?: string | null;
  onClose: () => void;
}

export default function MediaViewerModal({
  isOpen,
  mediaType,
  mediaData,
  mediaName,
  mediaSize,
  onClose,
}: MediaViewerModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!mediaData) return;
    const link = document.createElement("a");
    link.href = mediaData;
    const defaultExt = mediaType === "video" ? "mp4" : "jpg";
    link.download = mediaName || `download_${Date.now()}.${defaultExt}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex flex-col justify-between p-3 sm:p-6 select-none"
      >
        {/* Top Header Bar */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-5xl mx-auto flex items-center justify-between gap-3 text-white pb-3 border-b border-white/10"
        >
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-semibold truncate">
              {mediaName || (mediaType === "video" ? "Video Attachment" : "Photo Attachment")}
            </h3>
            {mediaSize && (
              <p className="text-[11px] text-zinc-400">{mediaSize}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#007AFF] hover:bg-[#0071E3] text-white text-xs sm:text-sm font-semibold shadow-lg transition-all active:scale-95 cursor-pointer"
              title="Download File"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Center Media Content */}
        <div
          onClick={(e) => e.stopPropagation()}
          className="flex-1 flex items-center justify-center p-2 sm:p-4 min-h-0 overflow-hidden"
        >
          {mediaType === "image" ? (
            <img
              src={mediaData}
              alt={mediaName || "Photo"}
              className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-white/10"
            />
          ) : (
            <video
              src={mediaData}
              controls
              autoPlay
              playsInline
              className="max-w-full max-h-[82vh] rounded-2xl shadow-2xl border border-white/10 bg-black"
            />
          )}
        </div>

        {/* Bottom Hint Bar */}
        <div className="text-center text-xs text-zinc-500 py-1">
          Tap anywhere or press Esc to close
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
