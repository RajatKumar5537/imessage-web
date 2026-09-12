"use client";

import React, { useState, useRef } from "react";
import { Check, Sparkles, Upload, RefreshCw } from "lucide-react";
import { PRESET_3D_AVATARS } from "@/lib/avatars";

interface AvatarPickerProps {
  selectedUrl: string;
  onSelect: (url: string) => void;
  userName?: string;
}

export default function AvatarPicker({
  selectedUrl,
  onSelect,
}: AvatarPickerProps) {
  const [activeTab, setActiveTab] = useState<"3d" | "upload">("3d");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const isCustomUploaded =
    selectedUrl.startsWith("data:image/") ||
    (!selectedUrl.includes("raw.githubusercontent.com") &&
      !selectedUrl.includes("dicebear.com"));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      onSelect(base64String);
      setIsUploading(false);
    };
    reader.onerror = () => {
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full bg-neutral-900/90 border border-white/10 rounded-2xl p-3 space-y-3">
      {/* 1. iOS Segmented Control Tabs */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-black/60 rounded-xl border border-white/10">
        <button
          type="button"
          onClick={() => setActiveTab("3d")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
            activeTab === "3d"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>3D Avatar</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("upload")}
          className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-semibold transition-all select-none ${
            activeTab === "upload"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
              : "text-neutral-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Upload className="w-3.5 h-3.5 text-blue-300" />
          <span>Upload Photo</span>
        </button>
      </div>

      {/* 2. Tab Content: 3D Avatars */}
      {activeTab === "3d" && (
        <div className="grid grid-cols-4 gap-2 pt-1 max-h-[160px] overflow-y-auto pr-1">
          {PRESET_3D_AVATARS.map((avatar) => {
            const isSelected = selectedUrl === avatar.url;
            return (
              <button
                key={avatar.id}
                type="button"
                onClick={() => onSelect(avatar.url)}
                className={`relative rounded-2xl p-2 transition-all flex flex-col items-center justify-center cursor-pointer group ${
                  isSelected
                    ? "bg-blue-600/30 border-2 border-blue-500 shadow-lg shadow-blue-500/25 ring-2 ring-blue-500/20 scale-[1.02]"
                    : "bg-white/[0.04] hover:bg-white/[0.09] border border-white/10 hover:border-white/20 hover:scale-[1.03]"
                }`}
              >
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-full overflow-hidden flex items-center justify-center p-0.5 group-hover:rotate-6 transition-transform">
                  <img
                    src={avatar.url}
                    alt={avatar.name}
                    className="w-full h-full object-contain drop-shadow-md"
                    loading="lazy"
                  />
                </div>
                <span className="text-[10px] text-neutral-300 group-hover:text-white truncate w-full text-center mt-1 font-medium">
                  {avatar.name}
                </span>

                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md ring-1 ring-neutral-900">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 3. Tab Content: Upload Custom Photo */}
      {activeTab === "upload" && (
        <div className="pt-0.5">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          {isCustomUploaded ? (
            <div className="flex flex-col items-center gap-2 py-2 bg-black/30 rounded-xl border border-white/5 p-3">
              <div className="relative">
                <img
                  src={selectedUrl}
                  alt="Custom Uploaded Photo"
                  className="w-14 h-14 rounded-full object-cover ring-2 ring-emerald-500 shadow-lg"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </div>
              </div>
              <p className="text-[11px] text-emerald-400 font-medium">
                Photo uploaded & active!
              </p>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/15 text-white text-xs font-semibold rounded-lg transition-all"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Choose Different Photo</span>
              </button>
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center py-4 px-3 border border-dashed border-white/20 hover:border-blue-500/80 rounded-xl cursor-pointer bg-black/20 hover:bg-white/5 transition-all group"
            >
              <div className="w-9 h-9 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                <Upload className="w-4 h-4" />
              </div>
              <p className="text-xs font-semibold text-white">
                {isUploading ? "Reading photo..." : "Upload Your Portrait Photo"}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                Click to browse files (JPG, PNG, WebP)
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
