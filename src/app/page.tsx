"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ConversationList, { ConversationItem } from "@/components/chat/ConversationList";
import ChatHeader from "@/components/chat/ChatHeader";
import MessageBubble, { MessageProps } from "@/components/chat/MessageBubble";
import MessageInputBar from "@/components/chat/MessageInputBar";
import FullScreenEffects from "@/components/effects/FullScreenEffects";
import GroupModal from "@/components/chat/GroupModal";
import ContactModal from "@/components/chat/ContactModal";
import SearchModal from "@/components/chat/SearchModal";
import ContactProfileModal from "@/components/chat/ContactProfileModal";
import ProfileSettingsModal from "@/components/chat/ProfileSettingsModal";
import CallModal from "@/components/call/CallModal";
import { soundEngine } from "@/lib/audio";
import { MessageSquare, Sparkles, Shield, Lock } from "lucide-react";

export default function PrimeChatApp() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Navigation & State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [replyTo, setReplyTo] = useState<any | null>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Real-time Effects
  const [activeEffect, setActiveEffect] = useState<any | null>(null);

  // Presence & Typing
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  // Modals
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isMyProfileModalOpen, setIsMyProfileModalOpen] = useState(false);
  const [customProfile, setCustomProfile] = useState<{ name?: string; avatar?: string; statusMessage?: string }>({});

  // WebRTC Call State
  const [activeCall, setActiveCall] = useState<any | null>(null);

  // Contacts & Pending Requests
  const [pendingIncomingRequests, setPendingIncomingRequests] = useState<any[]>([]);
  const prevIncomingRequestsCountRef = useRef<number | null>(null);



  // 1. Auth Guard
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Current user details
  const currentUserId = (session?.user as any)?.id || session?.user?.email || "";
  const currentUserName = customProfile.name || session?.user?.name || "User";
  const currentUserAvatar = customProfile.avatar || session?.user?.image || "";
  const currentUserStatus = customProfile.statusMessage || "Active now";

  // Scroll ref & Effect tracking
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesCountRef = useRef(0);
  const prevTotalUnreadRef = useRef<number | null>(null);
  const playedEffectIdsRef = useRef<Set<string>>(new Set());

  // 1. Fetch Conversations
  const fetchConversations = async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data: ConversationItem[] = await res.json();
        setConversations(data);

        // Calculate total unread
        const totalUnread = data.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

        if (prevTotalUnreadRef.current !== null && totalUnread > prevTotalUnreadRef.current) {
          soundEngine.playReceived();
        }
        prevTotalUnreadRef.current = totalUnread;
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  // 2. Fetch Contacts & Pending Requests
  const fetchContactsAndRequests = async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/chat/contacts");
      if (res.ok) {
        const data = await res.json();
        // API returns 'pendingIncoming' not 'incomingRequests'
        const incoming = data.pendingIncoming || data.incomingRequests || [];
        setPendingIncomingRequests(incoming);

        // Sound on new incoming request
        if (
          prevIncomingRequestsCountRef.current !== null &&
          incoming.length > prevIncomingRequestsCountRef.current
        ) {
          soundEngine.playReceived();
        }
        prevIncomingRequestsCountRef.current = incoming.length;
      }
    } catch (err) {
      console.error("Error fetching contacts & requests:", err);
    }
  };

  // 3. Fetch Messages for Active Conversation
  const fetchMessages = async (convId: string, isInitial = false, forceScroll = false) => {
    if (!convId) return;
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${convId}`);
      if (res.ok) {
        const data: MessageProps[] = await res.json();
        const hasNewMessages = data.length > prevMessagesCountRef.current;
        const lastMsg = data.length > 0 ? data[data.length - 1] : null;

        if (isInitial) {
          // Mark all existing messages as already played so they don't replay on poll
          data.forEach((m) => {
            if (m._id) playedEffectIdsRef.current.add(m._id);
          });
        } else if (hasNewMessages) {
          // Check if a brand-new message arrived with an effect
          if (lastMsg && !lastMsg.isMe && lastMsg.effect && lastMsg.effect !== "invisible_ink") {
            if (!playedEffectIdsRef.current.has(lastMsg._id)) {
              playedEffectIdsRef.current.add(lastMsg._id);
              soundEngine.playReceived();
              setActiveEffect(lastMsg.effect);
            }
          }
        }

        prevMessagesCountRef.current = data.length;
        setMessages(data);

        // Immediately sync the active conversation's lastMessage & isRead in the sidebar list
        if (data.length > 0) {
          const latest = data[data.length - 1];
          setConversations((prev) =>
            prev.map((c) => {
              if (c._id === convId) {
                return {
                  ...c,
                  unreadCount: 0,
                  lastMessage: {
                    text: latest.text || (latest.mediaType ? `[${latest.mediaType.toUpperCase()}]` : ""),
                    senderId: latest.senderId,
                    senderName: latest.senderName,
                    isMe: latest.isMe,
                    isRead: Boolean(latest.isRead),
                    readAt: latest.readBy?.[0]?.readAt,
                    createdAt: latest.createdAt,
                    mediaType: latest.mediaType || undefined,
                    effect: latest.effect || undefined,
                  },
                };
              }
              return c;
            })
          );
        }

        // Scroll logic:
        // - Always scroll on initial load or if explicitly forced (e.g. after sending)
        // - If new messages arrive, only scroll if the user is already near the bottom or if the user sent it
        // - DO NOT scroll during regular 2-second background poll when user is reading older messages
        if (isInitial || forceScroll) {
          setTimeout(() => {
            chatBottomRef.current?.scrollIntoView({ behavior: isInitial ? "auto" : "smooth" });
          }, 60);
        } else if (hasNewMessages) {
          const container = chatContainerRef.current;
          const isNearBottom = container
            ? container.scrollHeight - container.scrollTop - container.clientHeight < 160
            : true;

          if (isNearBottom || lastMsg?.isMe) {
            setTimeout(() => {
              chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
            }, 60);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching messages:", err);
    }
  };

  // 4. Poll Presence & Calls
  const checkPresenceAndCalls = async () => {
    if (status !== "authenticated") return;
    try {
      // Send heartbeat
      await fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeConversationId,
        }),
      });

      // Check active calls
      const callRes = await fetch("/api/chat/call");
      if (callRes.ok) {
        const callData = await callRes.json();
        setActiveCall(callData);
      }

      // Check typing indicator in active room
      if (activeConversationId) {
        const presenceRes = await fetch(`/api/chat/presence?conversationId=${activeConversationId}`);
        if (presenceRes.ok) {
          const presences = await presenceRes.json();
          const typing = presences
            .filter((p: any) => p.userId !== currentUserId && p.isTypingIn === activeConversationId)
            .map((p: any) => p.userName);
          setTypingUsers(typing);
        }
      }
    } catch (_) {}
  };

  // 5. Initial Data Load & Polling Loops
  useEffect(() => {
    if (status === "authenticated") {
      fetchConversations();
      fetchContactsAndRequests();
    }
  }, [status]);

  useEffect(() => {
    if (activeConversationId) {
      prevMessagesCountRef.current = 0;
      fetchMessages(activeConversationId, true);
    }
  }, [activeConversationId]);

  // Real-time interval loop
  useEffect(() => {
    if (status !== "authenticated") return;

    const interval = setInterval(() => {
      fetchConversations();
      fetchContactsAndRequests();
      if (activeConversationId) {
        fetchMessages(activeConversationId);
      }
      checkPresenceAndCalls();
    }, 2000);

    return () => clearInterval(interval);
  }, [status, activeConversationId]);

  // Active conversation object
  const activeConversation: any = conversations.find((c) => c._id === activeConversationId);

  // Total unread messages across all conversations
  const totalUnreadCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Handlers
  const handleSelectConversation = (id: string) => {
    setActiveConversationId(id);
    setMobileView("chat");
  };

  const handleSendMessage = async (msgData: any) => {
    if (!activeConversationId) return;

    // Trigger local effect immediately if sender selected an effect
    if (msgData.effect && msgData.effect !== "invisible_ink") {
      setActiveEffect(msgData.effect);
    }

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          ...msgData,
        }),
      });

      if (res.ok) {
        fetchMessages(activeConversationId, false, true);
        fetchConversations();
        setReplyTo(null);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    }
  };

  const handleReact = async (messageId: string, emoji: string) => {
    try {
      const res = await fetch("/api/chat/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji }),
      });
      if (res.ok && activeConversationId) {
        fetchMessages(activeConversationId);
      }
    } catch (_) {}
  };

  const handleEditMessage = async (msg: MessageProps) => {
    try {
      const res = await fetch("/api/chat/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId: msg._id, text: msg.text }),
      });
      if (res.ok && activeConversationId) {
        fetchMessages(activeConversationId);
      }
    } catch (_) {}
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      const res = await fetch(`/api/chat/messages?messageId=${messageId}`, {
        method: "DELETE",
      });
      if (res.ok && activeConversationId) {
        fetchMessages(activeConversationId);
        fetchConversations();
      }
    } catch (_) {}
  };

  const handleTogglePin = async (messageId: string, isPinned: boolean) => {
    try {
      const res = await fetch("/api/chat/messages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, isPinned }),
      });
      if (res.ok && activeConversationId) {
        fetchMessages(activeConversationId);
      }
    } catch (_) {}
  };

  const handleClearChat = async () => {
    if (!activeConversationId) return;
    if (!confirm("Are you sure you want to clear this conversation history for your view?")) return;

    try {
      const res = await fetch(`/api/chat/messages?conversationId=${activeConversationId}&clearAll=true`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchMessages(activeConversationId);
        fetchConversations();
      }
    } catch (_) {}
  };

  const handleJumpToMessage = (messageId: string) => {
    if (!messageId) return;
    const targetEl = document.getElementById(`chat-msg-${messageId}`) || document.getElementById(messageId);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(messageId);
      setTimeout(() => {
        setHighlightedMessageId((prev) => (prev === messageId ? null : prev));
      }, 2000);
    }
  };

  const handleSetDisappearingTimer = async (hours: number) => {
    if (!activeConversationId) return;
    try {
      // Optimistic local update
      setConversations((prev) =>
        prev.map((c) => (c._id === activeConversationId ? { ...c, disappearingHours: hours } : c))
      );

      // Persist to database
      const res = await fetch("/api/chat/conversations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          disappearingHours: hours,
        }),
      });

      if (res.ok) {
        fetchConversations();
      }
    } catch (err) {
      console.error("Failed to update disappearing timer:", err);
    }
  };

  const handleTyping = async (isTyping: boolean) => {
    if (!activeConversationId) return;
    try {
      await fetch("/api/chat/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activeConversationId,
          isTypingIn: isTyping ? activeConversationId : null,
        }),
      });
    } catch (_) {}
  };

  // Group creation
  const handleCreateGroup = async (name: string, participantIds: string[]) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "group",
          name,
          participantIds,
        }),
      });
      if (res.ok) {
        const newConv = await res.json();
        await fetchConversations();
        setActiveConversationId(newConv._id);
        setMobileView("chat");
      }
    } catch (_) {}
  };

  // Direct chat creation from contacts
  const handleStartDirectChat = async (peerUserId: string) => {
    try {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "direct",
          recipientId: peerUserId,
        }),
      });
      if (res.ok) {
        const conv = await res.json();
        setConversations((prev) => {
          const exists = prev.some((c) => c._id === conv._id);
          if (exists) {
            return prev.map((c) => (c._id === conv._id ? { ...c, ...conv } : c));
          }
          return [conv, ...prev];
        });
        setActiveConversationId(conv._id);
        setMobileView("chat");
        fetchMessages(conv._id, true);
        await fetchConversations();
      }
    } catch (err) {
      console.error("Error starting direct chat:", err);
    }
  };

  // Friend Request Accept / Decline handlers
  const handleAcceptRequest = async (connectionId: string) => {
    try {
      const res = await fetch("/api/chat/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, status: "accepted" }),
      });
      if (res.ok) {
        soundEngine.playSent();
        await fetchContactsAndRequests();
        await fetchConversations();
      }
    } catch (err) {
      console.error("Error accepting request:", err);
    }
  };

  const handleDeclineRequest = async (connectionId: string) => {
    try {
      const res = await fetch("/api/chat/contacts", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connectionId, status: "declined" }),
      });
      if (res.ok) {
        await fetchContactsAndRequests();
      }
    } catch (err) {
      console.error("Error declining request:", err);
    }
  };

  // WebRTC Call actions
  const handleStartCall = async (callType: "audio" | "video") => {
    if (!activeConversation) return;
    const recipientId = activeConversation.participants?.find((id: string) => id !== currentUserId);
    if (!recipientId) return;

    try {
      const res = await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "initiate",
          conversationId: activeConversation._id,
          recipientId,
          callType,
        }),
      });
      if (res.ok) {
        const callData = await res.json();
        setActiveCall(callData);
      }
    } catch (_) {}
  };

  const handleAcceptCall = async () => {
    if (!activeCall) return;
    try {
      const res = await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "accept",
          callId: activeCall._id,
        }),
      });
      if (res.ok) {
        setActiveCall((prev: any) => ({ ...prev, status: "accepted" }));
      }
    } catch (_) {}
  };

  const handleDeclineCall = async () => {
    if (!activeCall) return;
    try {
      await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "decline",
          callId: activeCall._id,
        }),
      });
      setActiveCall(null);
    } catch (_) {}
  };

  const handleEndCall = async () => {
    if (!activeCall) return;
    try {
      await fetch("/api/chat/call", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end",
          callId: activeCall._id,
        }),
      });
      setActiveCall(null);
    } catch (_) {}
  };

  if (status === "loading" || status === "unauthenticated") {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-[#020205] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/40 text-blue-400 animate-pulse flex items-center justify-center shadow-lg">
            <Shield className="w-6 h-6" />
          </div>
          <span className="text-xs text-slate-400 font-mono">Loading Encrypted Chats...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-[#000000] text-white p-0 sm:p-2 md:p-3 overflow-hidden select-none relative font-sans">
      {/* 🎆 FULL SCREEN PARTICLES / FIREWORKS ENGINE */}
      <FullScreenEffects
        effect={activeEffect}
        onComplete={() => setActiveEffect(null)}
      />

      {/* MAIN OBSIDIAN CONTAINER CARD */}
      <div className="w-full h-full sm:max-h-[96vh] sm:max-w-[1440px] bg-[#0A0A0C]/98 backdrop-blur-2xl border-0 sm:border border-white/10 sm:rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95),0_0_40px_rgba(0,122,255,0.1)] flex flex-row overflow-hidden relative">
        {/* 1. LEFT SIDEBAR: CONVERSATION LIST */}
        <div
          className={`${
            mobileView === "list" ? "flex" : "hidden"
          } md:flex h-full w-full md:w-[340px] lg:w-[380px] flex-shrink-0 z-20 overflow-x-hidden`}
        >
          <ConversationList
            conversations={conversations}
            selectedId={activeConversationId}
            pendingIncomingRequests={pendingIncomingRequests}
            onAcceptRequest={handleAcceptRequest}
            onDeclineRequest={handleDeclineRequest}
            onSelectConversation={handleSelectConversation}
            onOpenNewChat={() => setIsContactModalOpen(true)}
            onOpenNewGroup={() => setIsGroupModalOpen(true)}
            onOpenContacts={() => setIsContactModalOpen(true)}
            onOpenProfile={() => setIsMyProfileModalOpen(true)}
            currentUser={{
              name: currentUserName,
              email: session?.user?.email || "",
              avatar: currentUserAvatar,
              statusMessage: currentUserStatus,
            }}
          />
        </div>

        {/* 2. RIGHT / MAIN AREA: ACTIVE CHAT PANE */}
        <div
          className={`${
            mobileView === "chat" ? "flex" : "hidden"
          } md:flex flex-col flex-1 h-full w-full max-w-full min-w-0 bg-[#000000] bg-radial-[at_top_right] from-blue-950/15 via-[#000000] to-[#000000] relative overflow-x-hidden`}
        >
          {activeConversation ? (
            <>
              {/* TOP HEADER */}
              <ChatHeader
                conversation={activeConversation}
                totalUnreadCount={totalUnreadCount}
                onBackToConversations={() => {
                  setMobileView("list");
                  if (typeof window !== "undefined" && window.innerWidth < 768) {
                    // On mobile, switch view
                  } else {
                    setActiveConversationId(null);
                  }
                }}
                onStartAudioCall={() => handleStartCall("audio")}
                onStartVideoCall={() => handleStartCall("video")}
                onOpenSearch={() => setIsSearchModalOpen(true)}
                onOpenInfo={() => setIsProfileModalOpen(true)}
                onClearChat={handleClearChat}
                isTyping={typingUsers.length > 0}
                typingUserName={typingUsers[0]}
              />

              {/* MESSAGE FEED */}
              <div
                ref={chatContainerRef}
                className="flex-1 overflow-y-auto px-3 sm:px-5 py-3 sm:py-4 relative overscroll-contain"
              >
                <div className="w-full flex flex-col justify-start min-h-full pb-8 sm:pb-12 pt-2">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[160px] my-auto text-center space-y-2.5 p-6 border border-dashed border-white/10 rounded-3xl bg-white/[0.03] backdrop-blur-md">
                      <div className="p-3 rounded-2xl bg-blue-500/20 text-[#007AFF] border border-blue-400/30 shadow-inner">
                        <Sparkles size={24} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 font-mono">
                          iMessage with {activeConversation.name}
                        </h4>
                        <p className="text-xs text-slate-400 mt-1 max-w-sm">
                          {activeConversation.disappearingHours && activeConversation.disappearingHours > 0
                            ? `Messages are end-to-end encrypted and self-destruct in ${activeConversation.disappearingHours} hours.`
                            : "Messages are end-to-end encrypted with AES-256 GCM."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg._id}
                        className={`w-full flex-shrink-0 ${(msg.reactions?.length ?? 0) > 0 ? "mb-6 sm:mb-7" : "mb-4 sm:mb-4.5"}`}
                      >
                        <MessageBubble
                          message={msg}
                          currentUserId={currentUserId}
                          partnerName={activeConversation.name}
                          onReact={handleReact}
                          onReply={(m) => setReplyTo({ id: m._id, senderName: m.senderName, text: m.text, mediaType: m.mediaType })}
                          onEdit={handleEditMessage}
                          onDelete={handleDeleteMessage}
                          onTogglePin={handleTogglePin}
                          onTriggerEffect={(eff) => setActiveEffect(eff)}
                          onJumpToMessage={handleJumpToMessage}
                          isHighlighted={highlightedMessageId === msg._id}
                          showAvatar={activeConversation.type === "group"}
                        />
                      </div>
                    ))
                  )}

                  {/* LIVE TYPING BUBBLE (iOS 3-dot animation) */}
                  {typingUsers.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-1 flex-shrink-0 mb-2">
                      <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#26252A] border border-white/10 text-white text-xs shadow-md">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.2s]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300 animate-bounce [animation-delay:0.4s]" />
                        <span className="text-[11px] text-slate-400 font-medium ml-1.5">{typingUsers[0]} is typing...</span>
                      </div>
                    </div>
                  )}

                  <div className="h-4 sm:h-6 flex-shrink-0" />
                  <div ref={chatBottomRef} />
                </div>
              </div>

              {/* BOTTOM INPUT BAR */}
              <MessageInputBar
                onSendMessage={handleSendMessage}
                replyTo={replyTo}
                onClearReply={() => setReplyTo(null)}
                onTyping={handleTyping}
                currentDisappearingHours={activeConversation.disappearingHours || 0}
                onSetDisappearingTimer={handleSetDisappearingTimer}
                partnerName={activeConversation.name}
              />
            </>
          ) : (
            /* EMPTY STATE ON DESKTOP */
            <div className="hidden md:flex flex-col items-center justify-center flex-1 h-full text-center p-6 space-y-4">
              <div className="w-20 h-20 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shadow-lg">
                <Shield size={40} />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-lg font-bold text-white">iMessage Encrypted Chat</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select a contact from the sidebar or click <strong>+</strong> to start an end-to-end encrypted private conversation.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-blue-400 font-mono font-medium">
                  <Lock size={12} /> Disappearing Messages & E2EE Calling Enabled
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. MODALS */}
      {activeConversation && (
        <ContactProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          conversation={activeConversation}
          messages={messages}
          onStartAudioCall={() => handleStartCall("audio")}
          onStartVideoCall={() => handleStartCall("video")}
          onOpenSearch={() => setIsSearchModalOpen(true)}
          onClearChat={handleClearChat}
          onSetDisappearingTimer={handleSetDisappearingTimer}
        />
      )}

      <GroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        contacts={conversations.map((c) => ({
          userId: c.participants?.find((p) => p !== currentUserId) || "",
          name: c.name,
          email: "",
          avatar: c.icon,
        })).filter((c) => c.userId)}
        onOpenContacts={() => {
          setIsGroupModalOpen(false);
          setIsContactModalOpen(true);
        }}
        onCreateGroup={handleCreateGroup}
      />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => {
          setIsContactModalOpen(false);
          fetchContactsAndRequests();
          fetchConversations();
        }}
        onStartDirectChat={handleStartDirectChat}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        messages={messages}
        onSelectMessage={(msgId) => {
          handleJumpToMessage(msgId);
        }}
      />

      <ProfileSettingsModal
        isOpen={isMyProfileModalOpen}
        onClose={() => setIsMyProfileModalOpen(false)}
        currentUser={{
          name: currentUserName,
          email: session?.user?.email || "",
          avatar: currentUserAvatar,
          statusMessage: currentUserStatus,
        }}
        onProfileUpdated={(updated) => {
          setCustomProfile(updated);
          fetchConversations();
        }}
      />

      {/* 4. WEBRTC CALL OVERLAY */}
      {activeCall && (
        <CallModal
          call={activeCall}
          currentUserId={currentUserId}
          onEndCall={handleEndCall}
          onAcceptCall={handleAcceptCall}
          onDeclineCall={handleDeclineCall}
        />
      )}
    </div>
  );
}
