"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Phone,
  PhoneOff,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  Maximize2,
  Minimize2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { soundEngine } from "@/lib/audio";
import { getFallbackAvatar } from "@/lib/avatars";

interface CallModalProps {
  call: {
    _id: string;
    conversationId: string;
    callerId: string;
    callerName: string;
    callerAvatar?: string;
    recipientId: string;
    recipientName: string;
    recipientAvatar?: string;
    callType: "audio" | "video";
    status: "ringing" | "accepted" | "declined" | "ended";
  };
  currentUserId: string;
  onEndCall: () => void;
  onAcceptCall: () => void;
  onDeclineCall: () => void;
}

export default function CallModal({
  call,
  currentUserId,
  onEndCall,
  onAcceptCall,
  onDeclineCall,
}: CallModalProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(call.callType === "audio");
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFloatingPiP, setIsFloatingPiP] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const timerRef = useRef<any>(null);

  const isIncoming = call.recipientId === currentUserId && call.status === "ringing";
  const isOutgoing = call.callerId === currentUserId && call.status === "ringing";
  const isConnected = call.status === "accepted";

  // Peer metadata
  const peerName = call.callerId === currentUserId ? call.recipientName : call.callerName;
  const peerAvatar = call.callerId === currentUserId ? call.recipientAvatar : call.callerAvatar;

  // Ringtone management
  useEffect(() => {
    if (call.status === "ringing") {
      soundEngine.startRingtone();
    } else {
      soundEngine.stopRingtone();
    }
    return () => {
      soundEngine.stopRingtone();
    };
  }, [call.status]);

  // Duration timer when connected
  useEffect(() => {
    if (isConnected) {
      timerRef.current = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
      setupMediaAndPeer();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      cleanupMedia();
    };
  }, [isConnected]);

  const setupMediaAndPeer = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: call.callType === "video",
      });
      localStreamRef.current = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Initialize WebRTC Peer Connection with STUN servers
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      pcRef.current = pc;

      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
    } catch (err) {
      console.error("Failed to access media devices:", err);
    }
  };

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (pcRef.current) {
      pcRef.current.close();
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;

        const screenTrack = screenStream.getVideoTracks()[0];
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }

        if (pcRef.current) {
          const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
          if (sender) {
            sender.replaceTrack(screenTrack);
          }
        }

        screenTrack.onended = () => {
          stopScreenShare();
        };

        setIsScreenSharing(true);
      } else {
        stopScreenShare();
      }
    } catch (err) {
      console.error("Screen share error:", err);
    }
  };

  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (pcRef.current && videoTrack) {
        const sender = pcRef.current.getSenders().find((s) => s.track?.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
    setIsScreenSharing(false);
  };

  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  /* -------------------------------------------------------------
     A. FLOATING PICTURE-IN-PICTURE OVERLAY MODE
     ------------------------------------------------------------- */
  if (isFloatingPiP) {
    return (
      <motion.div
        drag
        dragConstraints={{ left: -200, right: 200, top: -200, bottom: 200 }}
        className="fixed bottom-20 right-6 z-50 w-72 bg-neutral-900/95 border border-white/20 rounded-3xl p-3 shadow-2xl backdrop-blur-2xl cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-white truncate">{peerName}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsFloatingPiP(false)}
              className="p-1 rounded-full text-neutral-400 hover:text-white"
              title="Expand Call"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onEndCall}
              className="p-1 rounded-full text-red-400 hover:bg-red-500/20"
              title="End Call"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {call.callType === "video" && (
          <div className="relative w-full h-36 bg-black rounded-2xl overflow-hidden mb-2">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="absolute bottom-2 right-2 w-16 h-20 bg-neutral-800 rounded-lg object-cover border border-white/20"
            />
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-neutral-400 font-mono">
          <span>{formatDuration(callSeconds)}</span>
          <div className="flex items-center gap-1">
            <button onClick={toggleMute} className="p-1 rounded text-white">
              {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  /* -------------------------------------------------------------
     B. FULL SCREEN / MODAL CALL INTERFACE
     ------------------------------------------------------------- */
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-2xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="relative w-full max-w-2xl bg-neutral-900 border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        {/* TOP BAR */}
        <div className="p-4 flex items-center justify-between border-b border-white/10 z-10">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {call.status === "ringing" ? "Connecting..." : `Call in Progress • ${formatDuration(callSeconds)}`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isConnected && (
              <button
                onClick={() => setIsFloatingPiP(true)}
                className="p-1.5 rounded-full text-neutral-400 hover:text-white hover:bg-white/10 transition-all"
                title="Minimize to Picture-in-Picture"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* MAIN VIDEO / AVATAR VIEWPORT */}
        <div className="relative flex-1 min-h-[360px] bg-neutral-950 flex items-center justify-center overflow-hidden">
          {call.callType === "video" && isConnected ? (
            <>
              {/* Remote Video Stream */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover min-h-[360px]"
              />

              {/* Local Video Stream (Self Preview PiP) */}
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="absolute top-4 right-4 w-28 h-36 bg-neutral-800 rounded-2xl object-cover border-2 border-white/20 shadow-2xl"
              />
            </>
          ) : (
            /* Audio Avatar View */
            <div className="flex flex-col items-center gap-4 py-12">
              <div className="relative">
                <img
                  src={peerAvatar || getFallbackAvatar(peerName, "user")}
                  alt={peerName}
                  className="w-28 h-28 rounded-full object-cover border-4 border-blue-500 shadow-2xl"
                />
                {call.status === "ringing" && (
                  <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-40" />
                )}
              </div>

              <div className="text-center">
                <h3 className="text-xl font-bold text-white">{peerName}</h3>
                <p className="text-xs text-neutral-400 mt-1">
                  {call.status === "ringing"
                    ? isIncoming
                      ? "Incoming Call..."
                      : "Calling..."
                    : `Encrypted Voice Session (${formatDuration(callSeconds)})`}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* BOTTOM CALL CONTROLS */}
        <div className="p-4 bg-neutral-900/90 border-t border-white/10 flex items-center justify-center gap-4">
          {isIncoming ? (
            /* INCOMING ACTIONS: ACCEPT OR DECLINE */
            <div className="flex items-center gap-6">
              <button
                onClick={onDeclineCall}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
                title="Decline Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={onAcceptCall}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95"
                title="Accept Call"
              >
                <Phone className="w-6 h-6" />
              </button>
            </div>
          ) : (
            /* ACTIVE / OUTGOING CONTROLS */
            <div className="flex items-center gap-3">
              {/* Mic Toggle */}
              <button
                onClick={toggleMute}
                className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                  isMuted ? "bg-red-600/30 text-red-400 border border-red-500" : "bg-white/10 text-white hover:bg-white/20"
                }`}
                title={isMuted ? "Unmute Mic" : "Mute Mic"}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* Video Camera Toggle */}
              {call.callType === "video" && (
                <button
                  onClick={toggleVideo}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                    isVideoOff ? "bg-red-600/30 text-red-400 border border-red-500" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
                >
                  {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
                </button>
              )}

              {/* Screen Share */}
              {call.callType === "video" && (
                <button
                  onClick={toggleScreenShare}
                  className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                    isScreenSharing ? "bg-blue-600 text-white" : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                  title="Share Screen"
                >
                  <Monitor className="w-5 h-5" />
                </button>
              )}

              {/* Hang Up Button */}
              <button
                onClick={onEndCall}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-red-600 hover:bg-red-500 text-white shadow-xl shadow-red-500/40 transition-all hover:scale-105 active:scale-95 ml-2"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
