"use client";

import { useEffect, useState } from "react";

// Always shown in `next dev`. On the live site it only appears after opening
// any page with ?debug=1 (remembered for the tab session; ?debug=0 turns it off).
const DEBUG_STORAGE_KEY = "stockai-debug";
const SUPPORT_EMAIL = "wahmed07860786@gmail.com";
const APP_VERSION = process.env.NEXT_PUBLIC_APP_VERSION ?? "1.0.0";

function buildDebugText() {
  return [
    `App Version: ${APP_VERSION}`,
    `URL:         ${window.location.href}`,
    `Browser:     ${navigator.userAgent}`,
    `Screen:      ${window.screen.width}x${window.screen.height} (viewport ${window.innerWidth}x${window.innerHeight})`,
    `Language:    ${navigator.language}`,
    `Build Env:   ${process.env.NODE_ENV}`,
    `Timestamp:   ${new Date().toISOString()}`,
  ].join("\n");
}

export default function DebugButton() {
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [crash, setCrash] = useState(false);
  const [enabled, setEnabled] = useState(process.env.NODE_ENV === "development");

  useEffect(() => {
    if (process.env.NODE_ENV === "development") return;
    const flag = new URLSearchParams(window.location.search).get("debug");
    try {
      if (flag === "1") sessionStorage.setItem(DEBUG_STORAGE_KEY, "1");
      if (flag === "0") sessionStorage.removeItem(DEBUG_STORAGE_KEY);
      setEnabled(sessionStorage.getItem(DEBUG_STORAGE_KEY) === "1");
    } catch {
      setEnabled(flag === "1");
    }
  }, []);

  // Throwing during render (not in a click handler) is what reaches React error boundaries.
  if (crash) throw new Error("Test Debug Exception");

  if (!enabled) return null;

  const copyInfo = async () => {
    try {
      await navigator.clipboard.writeText(buildDebugText());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setInfo(buildDebugText());
    }
  };

  const emailReport = () => {
    const subject = encodeURIComponent("[Debug Report] StockAI");
    const body = encodeURIComponent(
      `Hi Support,\n\nHere is my debug info:\n\n${buildDebugText()}\n\n--- describe your issue below ---\n`
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const close = () => {
    setOpen(false);
    setInfo(null);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open debug menu"
        className="fixed bottom-20 right-4 z-[9999] flex h-12 w-12 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-xl shadow-lg shadow-black/40 hover:bg-slate-800"
      >
        🐞
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[10000] flex items-end justify-center bg-black/55 sm:items-center"
          onClick={close}
        >
          <div
            className="w-full max-w-md rounded-t-2xl border border-slate-800 bg-slate-900 p-5 text-white sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold">🛠️ Developer Debug Menu</h2>
            <p className="mb-4 text-xs text-slate-400">Hidden from normal visitors · open with ?debug=1</p>

            <div className="divide-y divide-slate-800">
              <MenuItem emoji="📱" label="View System Info" onClick={() => setInfo(buildDebugText())} />
              <MenuItem emoji="📋" label={copied ? "Copied!" : "Copy Debug Info"} onClick={copyInfo} />
              <MenuItem emoji="💥" label="Test Crash / Error" onClick={() => setCrash(true)} />
              <MenuItem emoji="📧" label="Email Debug Report" onClick={emailReport} />
            </div>

            {info && (
              <pre className="mt-4 max-h-48 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-950 p-3 text-xs text-slate-300">
                {info}
              </pre>
            )}

            <button
              type="button"
              onClick={close}
              className="mt-5 w-full rounded-lg bg-slate-700 py-3 text-sm font-bold hover:bg-slate-600"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function MenuItem({ emoji, label, onClick }: { emoji: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 py-3.5 text-left text-[15px] font-medium text-slate-200 hover:text-white"
    >
      <span className="text-xl">{emoji}</span>
      {label}
    </button>
  );
}
