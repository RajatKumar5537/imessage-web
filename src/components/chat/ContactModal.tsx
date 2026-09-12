"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Search,
  UserPlus,
  Check,
  UserX,
  Clock,
  MessageSquare,
  Users,
  Mail,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getFallbackAvatar } from "@/lib/avatars";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartDirectChat: (userId: string, name: string) => void;
}

export default function ContactModal({
  isOpen,
  onClose,
  onStartDirectChat,
}: ContactModalProps) {
  const [activeTab, setActiveTab] = useState<"contacts" | "pending" | "search">("contacts");
  const [contacts, setContacts] = useState<any[]>([]);
  const [pendingIncoming, setPendingIncoming] = useState<any[]>([]);
  const [pendingOutgoing, setPendingOutgoing] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [sentSuccessId, setSentSuccessId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadContacts();
    }
  }, [isOpen]);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/chat/contacts");
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
        setPendingIncoming(data.pendingIncoming || []);
        setPendingOutgoing(data.pendingOutgoing || []);
      }
    } catch (err) {
      console.error("Error loading contacts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await fetch(`/api/chat/contacts?search=${encodeURIComponent(q.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data);
      }
    } catch (_) {}
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const res = await fetch("/api/chat/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        setSentSuccessId(userId);
        setTimeout(() => setSentSuccessId(null), 2000);
        loadContacts();
      }
    } catch (_) {}
  };

  const updateRequestStatus = async (connectionId: string, status: "accepted" | "declined") => {
    try {
      const res = await fetch("/api/chat/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, status }),
      });
      if (res.ok) {
        loadContacts();
      }
    } catch (_) {}
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          className="w-full max-w-lg min-h-[460px] max-h-[88dvh] bg-neutral-900/95 border border-white/15 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-2xl flex flex-col my-auto"
        >
          {/* Header Bar */}
          <div className="px-6 py-4 sm:py-5 flex items-center justify-between border-b border-white/10 bg-white/[0.03] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30 shadow-inner">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Contacts & Friends</h2>
                <p className="text-xs text-neutral-400">Manage connections & direct chats</p>
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

          {/* Segmented Tab Control */}
          <div className="px-6 pt-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-1 p-1 bg-black/50 border border-white/10 rounded-2xl">
              <button
                onClick={() => setActiveTab("contacts")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === "contacts"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Friends ({contacts.length})
              </button>

              <button
                onClick={() => setActiveTab("pending")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all relative cursor-pointer ${
                  activeTab === "pending"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <span>Requests</span>
                {pendingIncoming.length > 0 && (
                  <span className="ml-1.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-bold shadow-sm">
                    {pendingIncoming.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab("search")}
                className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === "search"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                Add New
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="p-6 pt-2 flex-1 flex flex-col overflow-y-auto">
            {/* TAB 1: FRIENDS LIST */}
            {activeTab === "contacts" && (
              <div className="flex-1 flex flex-col">
                {contacts.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-8 px-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-neutral-400 shadow-inner">
                      <Users className="w-7 h-7 stroke-1 text-blue-400" />
                    </div>
                    <p className="text-sm font-semibold text-white">No Friends Connected Yet</p>
                    <p className="text-xs text-neutral-400 mt-1 max-w-xs mb-4">
                      Search registered users to send a friend request and start encrypted messaging.
                    </p>
                    <button
                      onClick={() => setActiveTab("search")}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Find Friends</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {contacts.map((c) => (
                      <div
                        key={c.userId}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all shadow-sm"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={c.avatar || getFallbackAvatar(c.name, "user")}
                            alt={c.name}
                            className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white truncate">{c.name}</div>
                            <div className="text-xs text-neutral-400 truncate flex items-center gap-1.5 mt-0.5">
                              <Mail className="w-3.5 h-3.5 text-neutral-500 flex-shrink-0" />
                              <span className="font-mono">{c.email}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            onStartDirectChat(c.userId, c.name);
                            onClose();
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex-shrink-0 ml-2 cursor-pointer active:scale-95"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Chat</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: REQUESTS (INCOMING & OUTGOING) */}
            {activeTab === "pending" && (
              <div className="space-y-6 flex-1 flex flex-col">
                {/* Incoming Requests */}
                <div>
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
                    <span>Incoming Requests</span>
                    <span className="text-[11px] font-semibold text-neutral-500">({pendingIncoming.length})</span>
                  </div>
                  {pendingIncoming.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-neutral-500">
                      No incoming friend requests right now
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingIncoming.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.05] border border-white/10 shadow-sm"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={req.avatar || getFallbackAvatar(req.name, "user")}
                              alt={req.name}
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate">{req.name}</div>
                              <div className="text-xs text-neutral-400 truncate font-mono mt-0.5">{req.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            <button
                              onClick={() => updateRequestStatus(req._id, "accepted")}
                              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                              <span>Accept</span>
                            </button>
                            <button
                              onClick={() => updateRequestStatus(req._id, "declined")}
                              className="p-2 rounded-xl bg-white/10 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-all cursor-pointer"
                              title="Decline"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Sent Pending Requests */}
                <div>
                  <div className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5 px-1 flex items-center justify-between">
                    <span>Sent Requests</span>
                    <span className="text-[11px] font-semibold text-neutral-500">({pendingOutgoing.length})</span>
                  </div>
                  {pendingOutgoing.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-center text-xs text-neutral-500">
                      No sent pending requests
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {pendingOutgoing.map((req) => (
                        <div
                          key={req._id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 shadow-sm"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={req.avatar || getFallbackAvatar(req.name, "user")}
                              alt={req.name}
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate">{req.name}</div>
                              <div className="text-xs text-neutral-400 truncate font-mono mt-0.5">{req.email}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-inner">
                              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                              <span>Pending</span>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  await fetch(`/api/chat/contacts?connectionId=${req._id}`, { method: "DELETE" });
                                  loadContacts();
                                } catch (_) {}
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 text-xs font-medium border border-white/5 hover:border-red-500/30 transition-all cursor-pointer active:scale-95"
                              title="Cancel Request"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SEARCH & ADD NEW */}
            {activeTab === "search" && (
              <div className="flex-1 flex flex-col space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-3 px-4 py-3 bg-white/[0.04] hover:bg-white/[0.07] focus-within:bg-white/[0.07] border border-white/10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 rounded-2xl transition-all flex-shrink-0 shadow-inner">
                  <Search className="w-4.5 h-4.5 text-neutral-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Search by name or email (e.g. alex@...)"
                    className="w-full bg-transparent text-xs sm:text-sm text-white placeholder-neutral-500 focus:outline-none font-medium"
                    autoFocus
                  />
                  {searchQuery && (
                    <button
                      onClick={() => handleSearchUsers("")}
                      className="text-neutral-500 hover:text-white p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Results or Clean Prompt */}
                <div className="flex-1 overflow-y-auto space-y-2.5">
                  {searchResults.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center my-auto py-12 px-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-3 text-neutral-400 shadow-inner">
                        <Search className="w-7 h-7 text-blue-400 stroke-1" />
                      </div>
                      <p className="text-sm font-semibold text-white">
                        {searchQuery ? "No Users Found" : "Search Registered Users"}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1 max-w-xs">
                        {searchQuery
                          ? "Make sure the name or email is spelled correctly."
                          : "Type any name or email address to discover contacts."}
                      </p>
                    </div>
                  ) : (
                    searchResults.map((user) => {
                      const isRequested = sentSuccessId === user._id;
                      return (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/5 hover:border-white/15 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <img
                              src={user.avatar || getFallbackAvatar(user.name, "user")}
                              alt={user.name}
                              className="w-11 h-11 rounded-full object-cover ring-2 ring-white/10 flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="text-sm font-bold text-white truncate">{user.name}</div>
                              <div className="text-xs text-neutral-400 truncate font-mono mt-0.5">{user.email}</div>
                            </div>
                          </div>

                          <button
                            onClick={() => sendFriendRequest(user._id)}
                            disabled={isRequested}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ml-2 cursor-pointer active:scale-95 ${
                              isRequested
                                ? "bg-emerald-600 text-white shadow-emerald-500/20"
                                : "bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-500/25"
                            }`}
                          >
                            {isRequested ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Sent</span>
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
