import { useCallback, useEffect, useMemo, useState } from "react";

export type Participant = {
  id: string;
  username: string;
  winner: boolean;
};

export type Phase =
  | "setup"
  | "intro"
  | "verifying"
  | "ready"
  | "spinning"
  | "revealed";

const STORAGE_KEY = "emimoda-giveaway-v1";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, "").replace(/[,;]+$/, "").trim();
}

export function parseUsernameList(text: string): string[] {
  return text
    .split(/[\n,]+/)
    .map(normalizeUsername)
    .filter((v) => v.length > 0 && v.length < 60);
}

export function useGiveawayState() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Load from localStorage after mount to avoid SSR/hydration mismatch
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Participant[];
        if (Array.isArray(parsed)) setParticipants(parsed);
      }
    } catch {}
    setLoaded(true);
  }, []);
  const [phase, setPhase] = useState<Phase>("setup");
  const [adminMode, setAdminMode] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const params = new URLSearchParams(window.location.search);
    return params.get("admin") === "1" || true; // default to true; hide chrome during phases
  });
  const [revealedWinners, setRevealedWinners] = useState<string[]>([]);

  // persist (only after initial load to avoid wiping storage on first render)
  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(participants));
    } catch {}
  }, [participants, loaded]);

  // hidden shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === "E" || e.key === "e")) {
        setAdminMode((v) => !v);
      }
      if (e.key === "Escape") {
        setAdminMode(true);
        setPhase("setup");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const addUsernames = useCallback((text: string) => {
    const names = parseUsernameList(text);
    setParticipants((prev) => {
      const existing = new Set(prev.map((p) => p.username.toLowerCase()));
      const added: Participant[] = [];
      for (const n of names) {
        if (!existing.has(n.toLowerCase())) {
          existing.add(n.toLowerCase());
          added.push({ id: uid(), username: n, winner: false });
        }
      }
      return [...prev, ...added];
    });
  }, []);

  const removeParticipant = useCallback((id: string) => {
    setParticipants((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setParticipants([]);
    setRevealedWinners([]);
  }, []);

  const toggleWinner = useCallback((id: string) => {
    setParticipants((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      if (target.winner) {
        return prev.map((p) => (p.id === id ? { ...p, winner: false } : p));
      }
      const winnerCount = prev.filter((p) => p.winner).length;
      if (winnerCount >= 3) return prev;
      return prev.map((p) => (p.id === id ? { ...p, winner: true } : p));
    });
  }, []);

  const winners = useMemo(
    () => participants.filter((p) => p.winner).map((p) => p.username),
    [participants],
  );

  // Compute the 3 final winners (forced + random fill).
  const computeFinalWinners = useCallback((): string[] => {
    const forced = participants.filter((p) => p.winner).map((p) => p.username);
    const pool = participants
      .filter((p) => !p.winner)
      .map((p) => p.username);
    const result: string[] = [...forced];
    while (result.length < 3 && pool.length > 0) {
      const idx = Math.floor(Math.random() * pool.length);
      result.push(pool.splice(idx, 1)[0]);
    }
    return result.slice(0, 3);
  }, [participants]);

  const start = useCallback(() => {
    if (participants.length < 3) return;
    setRevealedWinners([]);
    setAdminMode(false);
    setPhase("intro");
  }, [participants.length]);

  const reset = useCallback(() => {
    setPhase("setup");
    setAdminMode(true);
    setRevealedWinners([]);
  }, []);

  return {
    participants,
    phase,
    setPhase,
    adminMode,
    setAdminMode,
    addUsernames,
    removeParticipant,
    clearAll,
    toggleWinner,
    winners,
    computeFinalWinners,
    revealedWinners,
    setRevealedWinners,
    start,
    reset,
  };
}