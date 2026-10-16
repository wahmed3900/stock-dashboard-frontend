"use client";

import { useState } from "react";

// Feedback destinations. Set NEXT_PUBLIC_BUG_FORM_URL in Vercel to show the Google Form option.
const GOOGLE_FORM_URL = process.env.NEXT_PUBLIC_BUG_FORM_URL ?? "";
const SUPPORT_EMAIL = "wahmed07860786@gmail.com";

function openReport(method: "form" | "email") {
  if (method === "form") {
    window.open(GOOGLE_FORM_URL, "_blank", "noopener");
    return;
  }
  const subject = encodeURIComponent("Bug Report - Closed Testing");
  const body = encodeURIComponent(
    `Describe the issue:\n\n\n` +
      `-------------------------\n` +
      `App URL: ${window.location.href}\n` +
      `Device/Browser: ${navigator.userAgent}\n` +
      `Screen Resolution: ${window.innerWidth}x${window.innerHeight}\n`
  );
  // location.href (not window.open) so the Capacitor WebView hands mailto to the email app.
  window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
}

export default function ReportBugButton({ variant = "floating" }: { variant?: "floating" | "menu-item" }) {
  const [isOpen, setIsOpen] = useState(false);

  const handleReport = (method: "form" | "email") => {
    openReport(method);
    setIsOpen(false);
  };

  // Navbar / settings menu entry
  if (variant === "menu-item") {
    return (
      <button
        type="button"
        onClick={() => handleReport(GOOGLE_FORM_URL ? "form" : "email")}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10"
      >
        <span className="text-base">🐛</span>
        <span>Report a Bug</span>
      </button>
    );
  }

  // Floating button, bottom right (for closed testing)
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="mb-2 w-60 space-y-2 rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm shadow-xl shadow-black/40">
          <p className="font-semibold text-white">Found an issue?</p>
          <p className="text-xs text-slate-400">Help us improve before the Play Store launch!</p>
          <div className="flex flex-col gap-1.5 pt-1">
            {GOOGLE_FORM_URL && (
              <button
                type="button"
                onClick={() => handleReport("form")}
                className="w-full rounded-md bg-blue-500/15 px-2.5 py-1.5 text-left text-xs font-medium text-blue-300 transition hover:bg-blue-500/25"
              >
                📝 Open Google Form
              </button>
            )}
            <button
              type="button"
              onClick={() => handleReport("email")}
              className="w-full rounded-md bg-slate-800 px-2.5 py-1.5 text-left text-xs font-medium text-slate-200 transition hover:bg-slate-700"
            >
              ✉️ Send Email
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Report Bug"
        aria-expanded={isOpen}
        className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-black/40 transition-all hover:bg-slate-800 active:scale-95"
      >
        <span>🐛</span>
        <span>Report Bug</span>
      </button>
    </div>
  );
}
