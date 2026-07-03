"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { onAuthStateChanged, type User } from "firebase/auth";
import { Send, Loader2 } from "lucide-react";
import { clientAuth, clientDb, firebaseEnabled } from "@/lib/firebase-client";
import { CHAT_CHANNELS } from "@/lib/chat";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  uid: string;
  name: string;
  photoURL: string | null;
  createdAt: Timestamp | null;
}

export function ChatClient({
  me,
}: {
  me: { uid: string; name: string; image: string | null };
}) {
  const [channelId, setChannelId] = useState(CHAT_CHANNELS[0].id);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Track the Firebase client auth state (needed to write messages).
  useEffect(() => {
    if (!clientAuth) return;
    return onAuthStateChanged(clientAuth, (u) => setAuthUser(u));
  }, []);

  // Subscribe to the selected channel's messages in real time.
  useEffect(() => {
    if (!clientDb) return;
    setMessages([]);
    setError(null);
    const q = query(
      collection(clientDb, "channels", channelId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setMessages(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              text: data.text ?? "",
              uid: data.uid ?? "",
              name: data.name ?? "Member",
              photoURL: data.photoURL ?? null,
              createdAt: (data.createdAt as Timestamp) ?? null,
            };
          })
        );
      },
      (err) => {
        console.error(err);
        setError("Couldn't load messages. Check your Firestore rules & config.");
      }
    );
    return unsub;
  }, [channelId]);

  // Auto-scroll to the newest message.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const channel = useMemo(
    () => CHAT_CHANNELS.find((c) => c.id === channelId) ?? CHAT_CHANNELS[0],
    [channelId]
  );

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !clientDb) return;
    if (!authUser) {
      setError("You need to be signed in to chat. Try reloading.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      await addDoc(collection(clientDb, "channels", channelId, "messages"), {
        text: body.slice(0, 2000),
        uid: authUser.uid,
        name: authUser.displayName ?? me.name,
        photoURL: authUser.photoURL ?? me.image ?? null,
        createdAt: serverTimestamp(),
      });
      setText("");
    } catch (err) {
      console.error(err);
      setError("Message failed to send.");
    } finally {
      setSending(false);
    }
  }

  if (!firebaseEnabled) {
    return (
      <div className="card text-sm text-slate-400">
        Live chat needs Firebase. Add the <code className="text-slate-200">NEXT_PUBLIC_FIREBASE_*</code>{" "}
        environment variables and deploy <code className="text-slate-200">firestore.rules</code> to enable it.
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Channels */}
      <div className="hidden w-52 shrink-0 flex-col gap-1 sm:flex">
        {CHAT_CHANNELS.map((c) => (
          <button
            key={c.id}
            onClick={() => setChannelId(c.id)}
            className={cn(
              "rounded-xl px-3 py-2 text-left text-sm transition",
              c.id === channelId ? "bg-brand-500/15 text-brand-200" : "text-slate-400 hover:bg-white/5"
            )}
          >
            <span className="font-medium">#{c.name}</span>
            <span className="block truncate text-xs text-slate-500">{c.description}</span>
          </button>
        ))}
      </div>

      {/* Conversation */}
      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-lab-border bg-lab-card">
        <div className="border-b border-lab-border px-4 py-3">
          <p className="font-semibold text-white">#{channel.name}</p>
          <p className="text-xs text-slate-500">{channel.description}</p>
          {/* mobile channel switcher */}
          <select
            className="input mt-2 sm:hidden"
            value={channelId}
            onChange={(e) => setChannelId(e.target.value)}
          >
            {CHAT_CHANNELS.map((c) => (
              <option key={c.id} value={c.id}>#{c.name}</option>
            ))}
          </select>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="py-10 text-center text-sm text-slate-500">
              No messages yet. Say hello 👋
            </p>
          ) : (
            messages.map((m) => {
              const mine = m.uid === me.uid;
              return (
                <div key={m.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                  <Avatar name={m.name} image={m.photoURL} className="h-8 w-8 shrink-0 text-[10px]" />
                  <div className={cn("max-w-[75%]", mine && "text-right")}>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="font-medium text-slate-300">{mine ? "You" : m.name}</span>
                      <span>{fmtTime(m.createdAt)}</span>
                    </div>
                    <div
                      className={cn(
                        "mt-1 inline-block whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm",
                        mine ? "bg-brand-600 text-white" : "bg-lab-bg text-slate-200"
                      )}
                    >
                      {m.text}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {error && <p className="px-4 pb-2 text-xs text-red-400">{error}</p>}

        <form onSubmit={send} className="flex items-center gap-2 border-t border-lab-border p-3">
          <input
            className="input"
            placeholder={`Message #${channel.name}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
          />
          <button type="submit" className="btn-primary shrink-0" disabled={sending || !text.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  );
}

function fmtTime(ts: Timestamp | null): string {
  if (!ts) return "sending…";
  try {
    return ts.toDate().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}
