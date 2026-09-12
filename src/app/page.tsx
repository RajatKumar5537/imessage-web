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
import { MessageSquare, Sparkles } from "lucide-react";

export default function PrimeChatApp() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Navigation & State
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [replyTo, setReplyTo] = useState<any | null>(null);
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

  // Scroll ref
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const prevMessagesCountRef = useRef(0);

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

  // 2. Fetch Conversations
  const fetchConversations = async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        setConversations(data);

        // Auto select first conversation if none selected on desktop
        if (!activeConversationId && data.length > 0 && typeof window !== "undefined" && window.innerWidth >= 768) {
          setActiveConversationId(data[0]._id);
        }
      }
    } catch (err) {
      console.error("Error fetching conversations:", err);
    }
  };

  // 3. Fetch Messages for Active Conversation
  const fetchMessages = async (convId: string, isInitial = false) => {
    if (!convId) return;
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${convId}`);
      if (res.ok) {
        const data: MessageProps[] = await res.json();

        // Check if a new message arrived with an effect
        if (data.length > prevMessagesCountRef.current && !isInitial) {
          const lastMsg = data[data.length - 1];
          if (!lastMsg.isMe) {
            soundEngine.playReceived();
            if (lastMsg.effect && lastMsg.effect !== "invisible_ink") {
              setActiveEffect(lastMsg.effect);
            }
          }
        }

        prevMessagesCountRef.current = data.length;
        setMessages(data);

        // Scroll to bottom on new message
        setTimeout(() => {
          chatBottomRef.current?.scrollIntoView({ behavior: isInitial ? "auto" : "smooth" });
        }, 50);
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
        fetchMessages(activeConversationId);
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

  const handleSetDisappearingTimer = async (hours: number) => {
    if (!activeConversationId) return;
    try {
      // Set timer locally and refresh
      setConversations((prev) =>
        prev.map((c) => (c._id === activeConversationId ? { ...c, disappearingHours: hours } : c))
      );
    } catch (_) {}
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
        await fetchConversations();
        setActiveConversationId(conv._id);
        setMobileView("chat");
      }
    } catch (_) {}
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
      <div className="h-[100dvh] w-full flex items-center justify-center bg-neutral-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 animate-pulse flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <span className="text-sm text-neutral-400 font-medium">Loading iMessage...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full max-w-full bg-neutral-950 text-white overflow-hidden overflow-x-hidden relative select-none">
      {/* 🎆 FULL SCREEN PARTICLES / FIREWORKS ENGINE (MATCHING SCREENSHOT #2) */}
      <FullScreenEffects
        effect={activeEffect}
        onComplete={() => setActiveEffect(null)}
      />

      {/* 1. LEFT SIDEBAR: CONVERSATION LIST */}
      <div
        className={`${
          mobileView === "list" ? "flex" : "hidden"
        } md:flex h-[100dvh] w-full max-w-full md:w-80 lg:w-96 flex-shrink-0 z-20 overflow-x-hidden`}
      >
        <ConversationList
          conversations={conversations}
          selectedId={activeConversationId}
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

      {/* 2. RIGHT / MAIN AREA: ACTIVE iMESSAGE CHAT */}
      <div
        className={`${
          mobileView === "chat" ? "flex" : "hidden"
        } md:flex flex-col flex-1 h-[100dvh] w-full max-w-full min-w-0 bg-neutral-950 relative overflow-x-hidden`}
      >
        {activeConversation ? (
          <>
            {/* TOP HEADER - CLICKING CONTACT PROFILE OPENS ContactProfileModal */}
            <ChatHeader
              conversation={activeConversation}
              totalUnreadCount={totalUnreadCount}
              onBackToConversations={() => setMobileView("list")}
              onStartAudioCall={() => handleStartCall("audio")}
              onStartVideoCall={() => handleStartCall("video")}
              onOpenSearch={() => setIsSearchModalOpen(true)}
              onOpenInfo={() => setIsProfileModalOpen(true)}
              onClearChat={handleClearChat}
              isTyping={typingUsers.length > 0}
              typingUserName={typingUsers[0]}
            />

            {/* MESSAGE FEED */}
            <div className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-1 relative">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                  <div className="w-16 h-16 rounded-full bg-neutral-900 border border-white/10 flex items-center justify-center mb-3">
                    <Sparkles className="w-7 h-7 text-blue-400" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-1">
                    Encrypted Conversation
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-sm">
                    Messages are protected with AES-256-GCM encryption. Try sending a message with
                    Fireworks or Invisible Ink!
                  </p>
                </div>
              ) : (
                messages.map((msg) => (
                  <MessageBubble
                    key={msg._id}
                    message={msg}
                    currentUserId={currentUserId}
                    onReact={handleReact}
                    onReply={(m) => setReplyTo({ id: m._id, senderName: m.senderName, text: m.text, mediaType: m.mediaType })}
                    onEdit={handleEditMessage}
                    onDelete={handleDeleteMessage}
                    onTogglePin={handleTogglePin}
                    onTriggerEffect={(eff) => setActiveEffect(eff)}
                    showAvatar={activeConversation.type === "group"}
                  />
                ))
              )}

              {/* LIVE TYPING BUBBLE */}
              {typingUsers.length > 0 && (
                <div className="flex items-center gap-2 px-3 py-2">
                  <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-neutral-800/80 border border-white/10 text-neutral-400">
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-2 h-2 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* BOTTOM INPUT BAR */}
            <MessageInputBar
              onSendMessage={handleSendMessage}
              replyTo={replyTo}
              onClearReply={() => setReplyTo(null)}
              onTyping={handleTyping}
              currentDisappearingHours={activeConversation.disappearingHours || 0}
              onSetDisappearingTimer={handleSetDisappearingTimer}
            />
          </>
        ) : (
          /* EMPTY STATE */
          <div className="hidden md:flex flex-col items-center justify-center flex-1 h-full text-center p-6 bg-neutral-950">
            <div className="w-20 h-20 rounded-3xl bg-neutral-900 border border-white/10 flex items-center justify-center mb-4 text-blue-500 shadow-2xl">
              <MessageSquare className="w-10 h-10" />
            </div>
            <h2 className="text-xl font-bold text-white">Select a Chat to Start Messaging</h2>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              Send encrypted texts, voice notes, photos, or full-screen fireworks effects.
            </p>
          </div>
        )}
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
        onCreateGroup={handleCreateGroup}
      />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        onStartDirectChat={handleStartDirectChat}
      />

      <SearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        messages={messages}
        onSelectMessage={(msgId) => {
          const el = document.getElementById(msgId);
          el?.scrollIntoView({ behavior: "smooth" });
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
