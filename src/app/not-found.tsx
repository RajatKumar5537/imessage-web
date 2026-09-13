import React from "react";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[var(--app-height,100%)] h-full bg-neutral-950 text-white p-6 text-center select-none">
      <div className="w-16 h-16 rounded-3xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-4 border border-blue-500/30 shadow-lg">
        <MessageSquare className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Page Not Found</h2>
      <p className="text-sm text-neutral-400 max-w-sm mb-6">
        The conversation, room, or page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold transition-all shadow-xl shadow-blue-500/25 cursor-pointer active:scale-95"
      >
        Return to iMessage
      </Link>
    </div>
  );
}

