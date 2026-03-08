import { DailyJournal } from "./types";

const STORAGE_KEY = "daily-journals";

export function loadJournals(): DailyJournal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveJournals(journals: DailyJournal[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(journals));
}

export function loadJournal(date: string): DailyJournal | undefined {
  return loadJournals().find((j) => j.date === date);
}

export function saveJournal(journal: DailyJournal) {
  const journals = loadJournals();
  const idx = journals.findIndex((j) => j.date === journal.date);
  if (idx >= 0) {
    journals[idx] = journal;
  } else {
    journals.push(journal);
  }
  saveJournals(journals);
}
