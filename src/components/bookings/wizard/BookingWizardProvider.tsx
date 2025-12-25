import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BookingDraft, defaultDraft } from "./bookingDraft";

const STORAGE_KEY = "bookingDraft_vella";

type BookingDraftContextValue = {
  draft: BookingDraft;
  updateDraft: (next: Partial<BookingDraft>) => void;
  resetDraft: () => void;
  setDraft: (next: BookingDraft) => void;
};

const BookingDraftContext = createContext<BookingDraftContextValue | undefined>(undefined);

export function BookingWizardProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraftState] = useState<BookingDraft>(defaultDraft);

  useEffect(() => {
    return () => { };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = window.localStorage.getItem(STORAGE_KEY);
    console.log("[BookingWizardProvider] Init - loading from localStorage:", saved ? "found" : "empty");
    if (!saved) return;
    try {
      const parsed = JSON.parse(saved) as BookingDraft;
      console.log("[BookingWizardProvider] Restored draft, email:", parsed.contact?.email);
      setDraftState({ ...defaultDraft, ...parsed });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    console.log("[BookingWizardProvider] Saving to localStorage, email:", draft.contact?.email);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  }, [draft]);

  const setDraft = useCallback((next: BookingDraft) => {
    setDraftState(next);
  }, []);

  const updateDraft = useCallback((next: Partial<BookingDraft>) => {
    setDraftState((prev) => ({
      ...prev,
      ...next,
      meta: {
        ...prev.meta,
        step: next.meta?.step ?? prev.meta.step,
      },
    }));
  }, []);

  const resetDraft = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    setDraftState(defaultDraft);
  }, []);

  const value = useMemo(
    () => ({
      draft,
      updateDraft,
      resetDraft,
      setDraft,
    }),
    [draft, updateDraft, resetDraft, setDraft]
  );

  return <BookingDraftContext.Provider value={value}>{children}</BookingDraftContext.Provider>;
}

export function useBookingDraft() {
  const ctx = useContext(BookingDraftContext);
  if (!ctx) {
    throw new Error("useBookingDraft must be used within BookingWizardProvider");
  }
  return ctx;
}
