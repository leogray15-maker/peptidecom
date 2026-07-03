"use client";

import { useState } from "react";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function VoteButton({
  postId,
  initialScore,
  initialVote,
}: {
  postId: string;
  initialScore: number;
  initialVote: number;
}) {
  const [score, setScore] = useState(initialScore);
  const [vote, setVote] = useState(initialVote);

  async function cast(value: 1 | -1) {
    // optimistic
    const prevVote = vote;
    const prevScore = score;
    const newVote = prevVote === value ? 0 : value;
    setVote(newVote);
    setScore(prevScore - prevVote + newVote);

    const res = await fetch("/api/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, value }),
    });
    if (res.ok) {
      const data = await res.json();
      setScore(data.score);
    } else {
      setVote(prevVote);
      setScore(prevScore);
    }
  }

  return (
    <div className="flex flex-col items-center">
      <button
        onClick={() => cast(1)}
        className={cn("rounded-lg p-1 hover:bg-white/5", vote === 1 ? "text-brand-300" : "text-slate-500")}
        aria-label="Upvote"
      >
        <ArrowBigUp className="h-6 w-6" />
      </button>
      <span className="text-sm font-semibold text-white">{score}</span>
      <button
        onClick={() => cast(-1)}
        className={cn("rounded-lg p-1 hover:bg-white/5", vote === -1 ? "text-red-400" : "text-slate-500")}
        aria-label="Downvote"
      >
        <ArrowBigDown className="h-6 w-6" />
      </button>
    </div>
  );
}
