// Un backend Supabase de neatins (rețea căzută, proiect greșit configurat) nu
// trebuie să blocheze o pagină la nesfârșit — cade pe fallback-ul mock rapid.
const TIMEOUT_MS = 5000;

export const fetchWithTimeout: typeof fetch = (input, init) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
};
