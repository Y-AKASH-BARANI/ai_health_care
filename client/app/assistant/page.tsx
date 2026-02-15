"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, ArrowLeft, Sparkles } from "lucide-react";
import { useUserStore } from "@/store/userStore";
import { sendChatMessage } from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

let _msgId = 0;
function nextId() {
  return `msg-${++_msgId}`;
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 px-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="inline-block h-2 w-2 rounded-full bg-zinc-500"
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.1, 0.85] }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

export default function AssistantPage() {
  const router = useRouter();
  const uid = useUserStore((s) => s.uid);
  const displayName = useUserStore((s) => s.displayName);

  // ── Hydration guard: only render after client mount ──
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading && mounted) inputRef.current?.focus();
  }, [isLoading, mounted]);

  const handleSendMessage = useCallback(
    async (overrideText?: string) => {
      const text = (overrideText ?? input).trim();
      if (!text || isLoading) return;

      const userMsg: Message = { id: nextId(), role: "user", content: text };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsLoading(true);

      try {
        const { reply } = await sendChatMessage(uid, text);
        setMessages((prev) => [
          ...prev,
          { id: nextId(), role: "assistant", content: reply },
        ]);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Something went wrong.";
        setMessages((prev) => [
          ...prev,
          {
            id: nextId(),
            role: "assistant",
            content: `I'm sorry, I couldn't process your request. ${errorMsg}`,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, uid],
  );

  // ── Pre-mount: full-screen loader ──
  if (!mounted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-emerald-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* ── Header ── */}
      <div className="shrink-0 border-b border-zinc-800/60 px-4 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="rounded-lg border border-zinc-700 p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <ArrowLeft size={16} style={{ display: "block" }} />
          </button>
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-zinc-700 bg-zinc-800 p-2">
              <Bot
                size={18}
                className="text-blue-400"
                style={{ display: "block" }}
              />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">
                Arogya Health Assistant
              </h1>
              <p className="text-[11px] text-zinc-500">
                Powered by Llama 3 &middot; Context-aware
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chat Area ── */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Empty State */}
          {messages.length === 0 && !isLoading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600/10">
                <Sparkles
                  size={28}
                  className="text-emerald-400"
                  style={{ display: "block" }}
                />
              </div>
              <h2 className="text-lg font-bold text-white">
                Hello{displayName ? `, ${displayName}` : ""}!
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-400">
                I have access to your health history. How can I help you today?
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  "Is my condition improving?",
                  "Summarise my last triage",
                  "Any health trends I should know?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSendMessage(suggestion)}
                    className="rounded-full border border-zinc-700 bg-zinc-800/60 px-3.5 py-1.5 text-xs text-zinc-400 transition-colors hover:border-emerald-500/50 hover:text-emerald-400"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                {msg.role === "user" ? (
                  <div className="flex-shrink-0 rounded-full bg-blue-900/50 p-2">
                    <User
                      size={16}
                      className="text-blue-300"
                      style={{ display: "block" }}
                    />
                  </div>
                ) : (
                  <div className="flex-shrink-0 rounded-full border border-zinc-700 bg-zinc-800 p-2">
                    <Bot
                      size={16}
                      className="text-blue-400"
                      style={{ display: "block" }}
                    />
                  </div>
                )}

                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "rounded-tr-md bg-blue-600 text-white"
                      : "rounded-tl-md border border-zinc-800 bg-zinc-900 text-zinc-300"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <Bot
                        size={14}
                        className="flex-shrink-0 text-blue-400"
                        style={{ display: "inline-block" }}
                      />
                      <span className="text-xs font-semibold text-blue-400">
                        Arogya
                      </span>
                    </div>
                  )}
                  {msg.content}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="flex gap-3"
              >
                <div className="flex-shrink-0 rounded-full border border-zinc-700 bg-zinc-800 p-2">
                  <Bot
                    size={16}
                    className="text-blue-400"
                    style={{ display: "block" }}
                  />
                </div>
                <div className="rounded-2xl rounded-tl-md border border-zinc-800 bg-zinc-900 px-4 py-3">
                  <TypingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Input Bar (sticky within flex column) ── */}
      <div className="shrink-0 border-t border-zinc-800 bg-zinc-900/80 p-6 backdrop-blur-md">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="mx-auto flex max-w-3xl gap-3"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your health history..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-zinc-700 bg-zinc-800/60 px-4 py-3 text-sm text-white placeholder-zinc-500 outline-none transition-colors focus:border-emerald-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex flex-shrink-0 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Send
              size={18}
              className="flex-shrink-0"
              style={{ display: "block" }}
            />
          </button>
        </form>
      </div>
    </div>
  );
}
