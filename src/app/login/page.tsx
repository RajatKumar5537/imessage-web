"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { MessageSquare, Lock, Mail, User, ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import AvatarPicker from "@/components/ui/AvatarPicker";
import { DEFAULT_AVATAR } from "@/lib/avatars";

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(DEFAULT_AVATAR);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isRegister) {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password,
            avatar: selectedAvatarUrl,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Failed to register account");
        }
      }

      const res = await signIn("credentials", {
        redirect: false,
        email: email.toLowerCase().trim(),
        password,
      });

      if (res?.error) {
        throw new Error(res.error);
      }

      router.push("/");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-viewport">
      {/* Dynamic Ambient Background Mesh Auras */}
      <div className="login-aura aura-1" />
      <div className="login-aura aura-2" />
      <div className="login-aura aura-3" />

      {/* Advanced Glass Card */}
      <div className="login-glass-card">
        {/* Top Specular Rim Light */}
        <div className="login-card-rim" />

        {/* Header Branding */}
        <div className="login-header">
          <div className="login-icon-wrapper">
            <div className="login-icon-glow" />
            <div className="login-icon-box">
              <MessageSquare className="login-logo-icon" />
            </div>
          </div>

          <div className="login-title-row">
            <h1 className="login-title">iMessage</h1>
            <span className="login-pill-badge">iOS 18</span>
          </div>

          <p className="login-subtitle">
            Next-Gen Private Messaging & Live Calling
          </p>
        </div>

        {/* Tab Segmented Switcher */}
        <div className="login-segmented-tabs">
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
            className={`login-segment-btn ${!isRegister ? "active" : ""}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
            className={`login-segment-btn ${isRegister ? "active" : ""}`}
          >
            Create Account
          </button>
        </div>

        {/* Error Alert */}
        {error && <div className="login-error-pill">{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {isRegister && (
            <>
              {/* Full Name & Avatar Preview */}
              <div className="flex items-center gap-3">
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full overflow-hidden ring-2 ring-blue-500/80 shadow-lg bg-neutral-800 flex items-center justify-center">
                    <img
                      src={selectedAvatarUrl}
                      alt="Selected Avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-neutral-900 shadow-sm" />
                </div>

                <div className="flex-1 min-w-0 login-field">
                  <label className="login-label">Full Name</label>
                  <div className="login-glass-input-wrap">
                    <User className="login-field-icon" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="login-input"
                    />
                  </div>
                </div>
              </div>

              {/* Avatar Selector */}
              <div className="login-field">
                <label className="login-label">Choose Avatar</label>
                <AvatarPicker
                  selectedUrl={selectedAvatarUrl}
                  onSelect={(url) => setSelectedAvatarUrl(url)}
                  userName={name}
                />
              </div>
            </>
          )}

          {/* Email Address */}
          <div className="login-field">
            <label className="login-label">Apple ID / Email</label>
            <div className="login-glass-input-wrap">
              <Mail className="login-field-icon" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="login-input"
              />
            </div>
          </div>

          {/* Password */}
          <div className="login-field">
            <label className="login-label">Password</label>
            <div className="login-glass-input-wrap">
              <Lock className="login-field-icon" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="login-input"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" disabled={loading} className="login-action-btn">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{isRegister ? "Creating Account..." : "Signing in..."}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>{isRegister ? "Sign Up & Launch" : "Sign In to iMessage"}</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>

        {/* Advanced Privacy Footer */}
        <div className="login-security-footer">
          <ShieldCheck className="w-3.5 h-3.5 text-blue-400/90" />
          <span>AES-256-GCM Encrypted • WebRTC Calling</span>
        </div>
      </div>

      <style jsx>{`
        .login-viewport {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100vw;
          height: 100dvh;
          overflow-y: auto;
          overflow-x: hidden;
          background: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
            system-ui, sans-serif;
          z-index: 50;
        }

        /* Ambient Dynamic Glow Orbs */
        .login-aura {
          position: fixed;
          border-radius: 50%;
          filter: blur(80px);
          pointer-events: none;
          z-index: 0;
          opacity: 0.28;
        }

        .aura-1 {
          top: 8%;
          left: 50%;
          transform: translateX(-50%);
          width: 420px;
          height: 420px;
          background: radial-gradient(circle, #007aff 0%, rgba(0, 122, 255, 0) 70%);
        }

        .aura-2 {
          bottom: 10%;
          left: 20%;
          width: 380px;
          height: 380px;
          background: radial-gradient(circle, #af52de 0%, rgba(175, 82, 222, 0) 70%);
        }

        .aura-3 {
          bottom: 15%;
          right: 20%;
          width: 320px;
          height: 320px;
          background: radial-gradient(circle, #32ade6 0%, rgba(50, 173, 230, 0) 70%);
        }

        /* 💎 Advanced Frosted Glass Card */
        .login-glass-card {
          width: 100%;
          max-width: 390px;
          background: rgba(20, 20, 24, 0.78);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 28px;
          padding: 24px 22px;
          box-shadow: 0 30px 70px -10px rgba(0, 0, 0, 0.9),
            0 0 0 1px rgba(255, 255, 255, 0.08) inset,
            0 0 45px rgba(0, 122, 255, 0.1);
          backdrop-filter: blur(50px) saturate(190%);
          -webkit-backdrop-filter: blur(50px) saturate(190%);
          position: relative;
          z-index: 10;
          box-sizing: border-box;
          margin: auto 0;
          overflow: hidden;
        }

        .login-card-rim {
          position: absolute;
          top: 0;
          left: 10%;
          right: 10%;
          height: 1px;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            rgba(0, 122, 255, 0.5),
            rgba(255, 255, 255, 0.4),
            transparent
          );
        }

        .login-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          margin-bottom: 16px;
        }

        .login-icon-wrapper {
          position: relative;
          margin-bottom: 10px;
        }

        .login-icon-glow {
          position: absolute;
          inset: -4px;
          border-radius: 18px;
          background: linear-gradient(135deg, #007aff, #af52de);
          filter: blur(10px);
          opacity: 0.5;
        }

        .login-icon-box {
          position: relative;
          width: 48px;
          height: 48px;
          border-radius: 14px;
          background: linear-gradient(145deg, #0a84ff 0%, #0062e3 100%);
          border: 1px solid rgba(255, 255, 255, 0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0, 122, 255, 0.4),
            0 2px 4px rgba(255, 255, 255, 0.3) inset;
        }

        .login-logo-icon {
          width: 24px;
          height: 24px;
          color: #ffffff;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
        }

        .login-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .login-title {
          font-size: 22px;
          font-weight: 700;
          letter-spacing: -0.03em;
          color: #ffffff;
          margin: 0;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
        }

        .login-pill-badge {
          font-size: 10.5px;
          font-weight: 700;
          background: linear-gradient(135deg, rgba(0, 122, 255, 0.25), rgba(175, 82, 222, 0.25));
          color: #5ac8fa;
          border: 1px solid rgba(90, 200, 250, 0.4);
          padding: 2px 8px;
          border-radius: 999px;
          box-shadow: 0 0 10px rgba(0, 122, 255, 0.2);
        }

        .login-subtitle {
          font-size: 12px;
          color: #98989f;
          margin-top: 4px;
          margin-bottom: 0;
          font-weight: 400;
        }

        /* 🎛️ Segmented Tabs */
        .login-segmented-tabs {
          display: flex;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 3px;
          margin-bottom: 14px;
        }

        .login-segment-btn {
          flex: 1;
          padding: 6.5px 0;
          font-size: 12.5px;
          font-weight: 600;
          color: #8e8e93;
          border-radius: 9px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .login-segment-btn.active {
          background: rgba(255, 255, 255, 0.18);
          color: #ffffff;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.15) inset;
        }

        .login-error-pill {
          background: rgba(255, 69, 58, 0.16);
          border: 1px solid rgba(255, 69, 58, 0.35);
          color: #ff453a;
          font-size: 11.5px;
          padding: 8px 12px;
          border-radius: 11px;
          margin-bottom: 12px;
          text-align: center;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 11px;
        }

        .login-field {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .login-label {
          font-size: 11px;
          font-weight: 600;
          color: #d1d1d6;
          padding-left: 2px;
          letter-spacing: -0.01em;
        }

        .login-glass-input-wrap {
          display: flex;
          align-items: center;
          gap: 8.5px;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 12px;
          padding: 8px 12px;
          transition: all 0.2s ease;
        }

        .login-glass-input-wrap:focus-within {
          border-color: #007aff;
          box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.25), 0 0 16px rgba(0, 122, 255, 0.15);
          background: rgba(0, 0, 0, 0.6);
        }

        .login-field-icon {
          width: 14.5px;
          height: 14.5px;
          color: #8e8e93;
          flex-shrink: 0;
        }

        .login-input {
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-size: 13px;
          width: 100%;
          font-family: inherit;
        }

        .login-input::placeholder {
          color: #636366;
        }

        /* 🚀 Action Button */
        .login-action-btn {
          width: 100%;
          height: 42px;
          background: linear-gradient(135deg, #007aff 0%, #0056d2 100%);
          color: #ffffff;
          font-size: 13.5px;
          font-weight: 700;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 4px;
          box-shadow: 0 6px 20px rgba(0, 122, 255, 0.4),
            0 1px 2px rgba(255, 255, 255, 0.3) inset;
          transition: all 0.15s ease;
        }

        .login-action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 26px rgba(0, 122, 255, 0.5),
            0 1px 2px rgba(255, 255, 255, 0.4) inset;
        }

        .login-action-btn:active {
          transform: translateY(0);
          box-shadow: 0 3px 12px rgba(0, 122, 255, 0.3);
        }

        .login-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        /* 🔒 Footer Security */
        .login-security-footer {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 11px;
          color: #8e8e93;
          font-weight: 500;
        }

        /* 💻 Laptop & Desktop Precision Tuning */
        @media (min-width: 768px) {
          .login-glass-card {
            max-width: 395px;
            padding: 22px 22px;
            border-radius: 26px;
          }

          .login-header {
            margin-bottom: 12px;
          }

          .login-icon-box {
            width: 42px;
            height: 42px;
          }

          .login-title {
            font-size: 20px;
          }

          .login-segmented-tabs {
            margin-bottom: 12px;
          }

          .login-form {
            gap: 9px;
          }

          .login-glass-input-wrap {
            padding: 7px 12px;
          }

          .login-action-btn {
            height: 40px;
            margin-top: 3px;
          }

          .login-security-footer {
            margin-top: 12px;
          }
        }
      `}</style>
    </div>
  );
}
