import { getAuthClient } from "@/src/lib/auth-client";

type AuthResult<T> = { data: T; error: { message?: string } | null };

type AuthUser = { id: string } | null;
type AuthSession = { user?: { id: string } } | null;

type Listener = (event: "SIGNED_IN" | "SIGNED_OUT", session: AuthSession) => void;

const listeners = new Set<Listener>();

async function emitAuthChange() {
  const { data } = await getSession();
  const session = data.session ?? null;
  const event: "SIGNED_IN" | "SIGNED_OUT" = session ? "SIGNED_IN" : "SIGNED_OUT";
  for (const cb of listeners) cb(event, session);
}

export async function refreshAuthState() {
  await emitAuthChange();
}

export async function signUpWithPassword(email: string, password: string) {
  // Better Auth requires a display name by default.
  const name = email.split('@')[0] || 'User';
  const res = await getAuthClient().signUp.email({
    email,
    name,
    password,
  });
  const r = res as unknown as AuthResult<{ user: AuthUser; session: AuthSession }>;
  void emitAuthChange();
  return {
    data: { user: r.data?.user ?? null, session: r.data?.session ?? null },
    error: r.error ?? null,
  };
}

export async function signInWithPassword(email: string, password: string) {
  const res = await getAuthClient().signIn.email({
    email,
    password,
  });
  const r = res as unknown as AuthResult<{ user: AuthUser; session: AuthSession }>;
  void emitAuthChange();
  return {
    data: { user: r.data?.user ?? null, session: r.data?.session ?? null },
    error: r.error ?? null,
  };
}

export async function signOut() {
  const res = await getAuthClient().signOut();
  const r = res as unknown as AuthResult<unknown>;
  void emitAuthChange();
  return { data: r.data ?? null, error: r.error ?? null };
}

export async function getSession() {
  const res = await getAuthClient().getSession();
  const r = res as unknown as AuthResult<AuthSession>;
  return {
    data: { session: r.data ?? null },
    error: r.error ?? null,
  };
}

export function onAuthStateChange(
  cb: (event: string, session: AuthSession) => void,
) {
  const listener: Listener = (event, session) => cb(event, session);
  listeners.add(listener);
  void emitAuthChange();
  return {
    data: {
      subscription: {
        unsubscribe: () => listeners.delete(listener),
      },
    },
  };
}

