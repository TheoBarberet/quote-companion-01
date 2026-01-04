import type { Devis, DevisStatus } from '@/types/devis';
import { mockDevis } from '@/data/mockDevis';

// Store partagé pour les devis (sera remplacé par la base de données)

let devisList: Devis[] = [...mockDevis];

type Listener = () => void;
const listeners: Set<Listener> = new Set();

function notifyListeners() {
  listeners.forEach((l) => l());
}

function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

function nextReference(date = new Date()) {
  const year = date.getFullYear();
  const prefix = `DEV-${year}-`;

  const numbers = devisList
    .map((d) => d.reference)
    .filter((r) => r.startsWith(prefix))
    .map((r) => Number(r.slice(prefix.length)))
    .filter((n) => Number.isFinite(n));

  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `${prefix}${String(next).padStart(3, '0')}`;
}

export function getDevis(): Devis[] {
  return [...devisList];
}

export function getDevisById(id: string): Devis | null {
  return devisList.find((d) => d.id === id) ?? null;
}

export function addDevis(
  payload: Omit<Devis, 'id' | 'reference' | 'dateCreation' | 'dateModification'> & {
    status?: DevisStatus;
  }
): Devis {
  const now = new Date();
  const date = todayISODate();

  const newDevis: Devis = {
    id: crypto.randomUUID(),
    reference: nextReference(now),
    dateCreation: date,
    dateModification: date,
    ...payload,
    status: payload.status ?? 'pending',
  };

  devisList = [newDevis, ...devisList];
  notifyListeners();
  return newDevis;
}

export function updateDevis(
  id: string,
  updates: Partial<Omit<Devis, 'id' | 'reference' | 'dateCreation'>>
): Devis | null {
  const existing = devisList.find((d) => d.id === id);
  if (!existing) return null;

  const updated: Devis = {
    ...existing,
    ...updates,
    dateModification: todayISODate(),
  };

  devisList = devisList.map((d) => (d.id === id ? updated : d));
  notifyListeners();
  return updated;
}

export function subscribeDevis(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
