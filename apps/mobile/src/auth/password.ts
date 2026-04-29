import { env } from "@/src/config/env";
import { getAuthClient } from "@/src/lib/auth-client";

type AuthResult<T> = { data: T; error: { message?: string } | null };

type PasswordActions = {
  requestPasswordReset: (input: {
    email: string;
    redirectTo: string;
  }) => Promise<unknown>;
  resetPassword: (input: { token: string; newPassword: string }) => Promise<unknown>;
};

export async function requestPasswordReset(email: string) {
  const client = getAuthClient() as unknown as PasswordActions;
  const redirectTo = `${env.APP_SCHEME}://reset-password`;
  const res = await client.requestPasswordReset({
    email,
    redirectTo,
  });
  const r = res as unknown as AuthResult<{ status: boolean; message: string }>;
  return { data: r.data ?? null, error: r.error ?? null };
}

export async function resetPassword(token: string, newPassword: string) {
  const client = getAuthClient() as unknown as PasswordActions;
  const res = await client.resetPassword({
    token,
    newPassword,
  });
  const r = res as unknown as AuthResult<{ status: string }>;
  return { data: r.data ?? null, error: r.error ?? null };
}

