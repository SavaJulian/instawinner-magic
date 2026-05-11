import { useRef, useState } from "react";
import { Star, Trash2, Upload, Sparkles } from "lucide-react";
import logo from "@/assets/emimoda-logo.png";
import type { Participant } from "@/hooks/useGiveawayState";

export function ParticipantEditor({
  participants,
  addUsernames,
  removeParticipant,
  clearAll,
  toggleWinner,
  onStart,
}: {
  participants: Participant[];
  addUsernames: (text: string) => void;
  removeParticipant: (id: string) => void;
  clearAll: () => void;
  toggleWinner: (id: string) => void;
  onStart: () => void;
}) {
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const winnersChosen = participants.filter((p) => p.winner).length;
  const canStart = participants.length >= 3;

  const handleAdd = () => {
    if (!text.trim()) return;
    addUsernames(text);
    setText("");
  };

  const handleFile = async (file: File) => {
    const t = await file.text();
    addUsernames(t);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <div className="mb-10 flex flex-col items-center gap-4 text-center">
        <img
          src={logo}
          alt="EmiModa"
          className="w-[60vw] max-w-[420px]"
          style={{ filter: "brightness(0) invert(1)" }}
        />
        <div>
          <div className="font-mono text-xs uppercase tracking-[0.3em] text-foreground/50">
            Giveaway control room
          </div>
          <h1 className="mt-2 font-display text-4xl text-foreground md:text-5xl">
            Pick your three winners
          </h1>
          <p className="mt-3 font-mono text-xs text-foreground/40">
            Star up to 3 names to set the outcome &middot; Shift+E toggles this panel
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-foreground/10 bg-foreground/[0.02] p-5">
        <label className="font-mono text-[0.7rem] uppercase tracking-[0.25em] text-foreground/50">
          Paste @usernames (one per line or comma-separated)
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={"@user1\n@user2\n@user3"}
          className="mt-2 w-full resize-none rounded-lg border border-foreground/10 bg-background/40 p-3 font-mono text-sm text-foreground outline-none placeholder:text-foreground/20 focus:border-[var(--gold)]/40"
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            onClick={handleAdd}
            className="rounded-md bg-[var(--gold)] px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-[var(--gold-foreground)] transition hover:opacity-90"
          >
            Add
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-md border border-foreground/15 px-4 py-2 font-mono text-xs uppercase tracking-[0.2em] text-foreground/80 transition hover:border-foreground/40"
          >
            <Upload className="h-3.5 w-3.5" /> Upload CSV/TXT
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,text/plain,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {participants.length > 0 && (
            <button
              onClick={clearAll}
              className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.25em] text-foreground/40 transition hover:text-red-400"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between font-mono text-xs uppercase tracking-[0.25em] text-foreground/50">
        <span>{participants.length} participants</span>
        <span className="text-[var(--gold)]">{winnersChosen} / 3 starred</span>
      </div>

      <div className="mt-3 max-h-[40vh] overflow-y-auto rounded-xl border border-foreground/10 bg-foreground/[0.02]">
        {participants.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-foreground/30">
            No participants yet. Add some above.
          </div>
        ) : (
          <ul>
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between border-b border-foreground/5 px-4 py-2.5 last:border-b-0"
              >
                <button
                  onClick={() => toggleWinner(p.id)}
                  className="mr-3 flex h-7 w-7 items-center justify-center rounded-full transition hover:bg-foreground/5"
                  title={p.winner ? "Unmark winner" : "Mark as winner"}
                >
                  <Star
                    className={`h-4 w-4 transition ${
                      p.winner
                        ? "fill-[var(--gold)] text-[var(--gold)]"
                        : "text-foreground/30"
                    }`}
                  />
                </button>
                <span className="flex-1 font-mono text-sm text-foreground/90">
                  @{p.username}
                </span>
                <button
                  onClick={() => removeParticipant(p.id)}
                  className="text-foreground/30 transition hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        onClick={onStart}
        disabled={!canStart}
        className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold)] px-6 py-4 font-display text-xl text-[var(--gold-foreground)] transition disabled:cursor-not-allowed disabled:opacity-30 enabled:hover:scale-[1.01]"
        style={{
          boxShadow:
            "0 0 60px -10px color-mix(in oklab, var(--gold) 60%, transparent)",
        }}
      >
        <Sparkles className="h-5 w-5" />
        Start the giveaway
      </button>
      <p className="mt-3 text-center font-mono text-[0.6rem] uppercase tracking-[0.3em] text-foreground/30">
        Need at least 3 participants &middot; Press Space to spin &middot; R to reset
      </p>
    </div>
  );
}