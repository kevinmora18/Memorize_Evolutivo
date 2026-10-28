import { useSyncExternalStore } from 'react';
import { useReducedMotion } from 'framer-motion';

export type EffectsLevel = 'full' | 'reduced';

const STORAGE_KEY = 'an_effects';
const listeners = new Set<() => void>();

function readLevel(): EffectsLevel {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'reduced' ? 'reduced' : 'full';
  } catch {
    return 'full';
  }
}

function applyLevel(level: EffectsLevel) {
  if (typeof document !== 'undefined') {
    document.documentElement.dataset.effects = level;
  }
}

applyLevel(readLevel());

export function setEffectsLevel(level: EffectsLevel) {
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch {
    /* almacenamiento no disponible */
  }
  applyLevel(level);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useEffectsLevel(): EffectsLevel {
  return useSyncExternalStore(subscribe, readLevel, () => 'full');
}

export function useReducedEffects(): boolean {
  const level = useEffectsLevel();
  const systemReduced = useReducedMotion();
  return level === 'reduced' || !!systemReduced;
}
