# Prime Chat — Flagship iOS 18 / iMessage Web Application

**Prime Chat** is a standalone, next-generation chat application inspired by **Apple iOS 18 iMessage**, built with Next.js 15, TypeScript, Tailwind CSS, and MongoDB.

It operates with complete database isolation under the **`prime-chat`** database in MongoDB, completely independent from `personal-tracker`.

---

## 🌟 Key Features

### 1. 🎆 Full-Screen & Bubble Screen Effects Engine
- **Fireworks 🎆**: Dazzling bursting fireworks with particle physics, gravity, trails, and crackling audio (matching native iOS screenshot!).
- **Balloons 🎈**: Rising translucent festive helium balloons with strings.
- **Confetti 🎉**: Fluttering celebration cascade of metallic ribbons and confetti.
- **Hearts ❤️**: Swelling floating 3D hearts rising across the dark screen.
- **Lasers ⚡**: Diagonal moving nightclub laser sweeps.
- **Invisible Ink 🪄**: Secret message covered in glittering scratch dust—hover/scratch to reveal!
- **Auto-Triggers**: Typing phrases like *"Happy New Year"*, *"Congratulations"*, *"Happy Birthday"*, or *"I love you"* automatically triggers the corresponding effect!

### 2. 🌟 iOS Tapback Reactions & Context Menu
- Floating frosted Apple reaction pill: **❤️ (Love), 👍 (Like), 👎 (Dislike), 😂 (HaHa), ‼️ (Emphasis), ❓ (Question)** + **Custom Emoji Picker**.
- Docked reaction badge animated on bubble corners.
- Inline editing, quote reply with focus blur, pinned messages, and delete for everyone.

### 3. 🎙️ Push-to-Talk Voice Memos & Rich Media
- One-click voice recorder with live audio frequency waveform.
- Interactive audio player with **1x / 1.5x / 2x playback speed** and waveform scrubber.
- Photo, video, and document file sharing.
- Self-destructing **disappearing messages timer** (1m, 1hr, 24hr, 7d).

### 4. 👥 Direct 1-on-1 & Group Chats
- 1-on-1 private messaging with AES-256-GCM encryption.
- Multi-user group conversations with custom icons, member invitations, and admin roles.
- Friend requests and contact discovery by email or name.

### 5. 📞 WebRTC Audio & Video Calling
- P2P Audio and Video calling with ringing audio cues.
- **Screen Sharing** in HD during video calls.
- **Picture-in-Picture (PiP) Floating Window**: Minimize the call to a draggable corner bubble to chat while calling!

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. One-Click Demo Accounts
On the login screen, you can click:
- **Rajat**: `rajat@primechat.io` (Password: `prime123`)
- **Swarna 🥰**: `swarna@primechat.io` (Password: `prime123`)

---

## 🗄️ Database Architecture (`prime-chat`)

The application connects to MongoDB using the dedicated database path:
```
mongodb+srv://.../prime-chat?retryWrites=true&w=majority
```

### Isolated Collections:
- `prime_users`: Profiles, avatars, online status, theme preferences.
- `prime_conversations`: Direct & group chat metadata, participants, pinned status.
- `prime_messages`: AES-256-GCM encrypted messages, effects, reactions, replies, voice notes.
- `prime_connections`: Contact lists & pending friend requests.
- `prime_calls`: WebRTC call signaling sessions & ICE candidates.
- `prime_presences`: Live typing indicators & active room heartbeats.
