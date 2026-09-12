"use client";

import React, { useState } from "react";
import { X, Users, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFallbackAvatar } from "@/lib/avatars";

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Array<{ userId: string; name: string; email: string; avatar?: string }>;
  onCreateGroup: (name: string, selectedUserIds: string[]) => void;
}

export default function GroupModal({
  isOpen,
  onClose,
  contacts,
  onCreateGroup,
}: GroupModalProps) {
  const [groupName, setGroupName] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!groupName.trim() || selectedIds.length === 0) return;
    setLoading(true);
    await onCreateGroup(groupName.trim(), selectedIds);
    setLoading(false);
    setGroupName("");
    setSelectedIds([]);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="w-full max-w-lg min-h-[460px] max-h-[85dvh] flex flex-col bg-neutral-900/95 border border-white/15 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl"
        >
          {/* Header Bar */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-white/10 bg-white/[0.03] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">New Group Conversation</h2>
                <p className="text-xs text-neutral-400">Add multiple friends to a shared room</p>
              </div>
            </div>

            {/* Prominent High-Contrast Close Button */}
            <button
              onClick={onClose}
              type="button"
              className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white flex items-center justify-center transition-all border border-white/20 shadow-md flex-shrink-0 cursor-pointer"
              title="Close"
            >
              <X className="w-4.5 h-4.5 text-white stroke-[2.5]" />
            </button>
          </div>

          <div className="flex-1 flex flex-col p-6 space-y-4 overflow-y-auto">
            {/* Group Name */}
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1.5">
                Group Name
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Project Alpha, Family & Friends"
                className="w-full bg-white/[0.04] hover:bg-white/[0.07] focus:bg-white/[0.07] border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-neutral-500 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all font-medium shadow-inner"
                autoFocus
              />
            </div>

            {/* Select Members */}
            <div className="flex-1 flex flex-col min-h-[180px]">
              <label className="text-xs font-semibold text-neutral-300 block mb-2">
                Select Members ({selectedIds.length} chosen)
              </label>
              <div className="flex-1 max-h-56 overflow-y-auto space-y-2 pr-1">
                {contacts.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-neutral-400">
                    No contacts available yet. Add friends first!
                  </div>
                ) : (
                  contacts.map((contact) => {
                    const isSelected = selectedIds.includes(contact.userId);
                    return (
                      <button
                        key={contact.userId}
                        type="button"
                        onClick={() => toggleSelect(contact.userId)}
                        className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600/25 border border-blue-500/50 shadow-md shadow-blue-500/15"
                            : "bg-white/[0.04] hover:bg-white/[0.08] border border-white/5"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={contact.avatar || getFallbackAvatar(contact.name, "user")}
                            alt={contact.name}
                            className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                          />
                          <div className="text-left min-w-0">
                            <div className="text-xs sm:text-sm font-bold text-white truncate">{contact.name}</div>
                            <div className="text-[11px] text-neutral-400 truncate font-mono mt-0.5">{contact.email}</div>
                          </div>
                        </div>

                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all flex-shrink-0 ml-2 ${
                            isSelected
                              ? "bg-blue-600 border-blue-400 text-white shadow-md"
                              : "border-neutral-600 text-transparent"
                          }`}
                        >
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-white/10 bg-white/[0.02] flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading || !groupName.trim() || selectedIds.length === 0}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white shadow-lg shadow-blue-500/25 transition-all cursor-pointer active:scale-95"
            >
              {loading ? "Creating..." : "Create Group"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
