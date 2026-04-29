import * as SecureStore from "expo-secure-store";
import { getActiveStoragePrefix, setActiveStoragePrefix } from "@/src/lib/auth-client";
import { getSession, refreshAuthState } from "@/src/auth/session";

export type StoredAccount = {
  id: string;
  email: string;
  label: string;
  storagePrefix: string;
  lastUsedAt: number;
};

const ACCOUNTS_KEY = "budgetcoach.accounts.v1";
const ACTIVE_PREFIX_KEY = "budgetcoach.activePrefix.v1";

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function loadAccounts(): Promise<StoredAccount[]> {
  const raw = await SecureStore.getItemAsync(ACCOUNTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as StoredAccount[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveAccounts(accounts: StoredAccount[]) {
  await SecureStore.setItemAsync(ACCOUNTS_KEY, JSON.stringify(accounts));
}

export async function getActiveAccountPrefix(): Promise<string> {
  const stored = await SecureStore.getItemAsync(ACTIVE_PREFIX_KEY);
  return stored || getActiveStoragePrefix();
}

export async function hydrateActiveAccountFromStorage() {
  const prefix = await getActiveAccountPrefix();
  setActiveStoragePrefix(prefix);
}

export async function setActiveAccountPrefix(prefix: string) {
  setActiveStoragePrefix(prefix);
  await SecureStore.setItemAsync(ACTIVE_PREFIX_KEY, prefix);
  await refreshAuthState();
}

export async function upsertCurrentAccountMeta(email: string) {
  const e = normalizeEmail(email);
  const accounts = await loadAccounts();
  const prefix = getActiveStoragePrefix();

  const existing = accounts.find((a) => a.storagePrefix === prefix || a.email === e);
  const now = Date.now();
  if (existing) {
    existing.email = e;
    existing.label = existing.label || e.split("@")[0] || "Account";
    existing.lastUsedAt = now;
  } else {
    accounts.unshift({
      id: `${now}-${Math.random().toString(16).slice(2)}`,
      email: e,
      label: e.split("@")[0] || "Account",
      storagePrefix: prefix,
      lastUsedAt: now,
    });
  }

  // De-dupe by storagePrefix
  const deduped = new Map(accounts.map((a) => [a.storagePrefix, a]));
  await saveAccounts(Array.from(deduped.values()).sort((a, b) => b.lastUsedAt - a.lastUsedAt));
}

export async function createNewAccountSlot(seedEmail: string) {
  const now = Date.now();
  const e = seedEmail ? normalizeEmail(seedEmail) : "";
  const prefix = e ? `budgetcoach:${e}:${now}` : `budgetcoach:slot:${now}`;
  await setActiveAccountPrefix(prefix);
}

export async function switchToAccount(storagePrefix: string) {
  await setActiveAccountPrefix(storagePrefix);
  return await getSession();
}

export async function removeAccount(storagePrefix: string) {
  const accounts = await loadAccounts();
  const filtered = accounts.filter((a) => a.storagePrefix !== storagePrefix);
  await saveAccounts(filtered);
}

