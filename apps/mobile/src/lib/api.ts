import { env } from "@/src/config/env";

export async function apiFetch<T>(
  path: string,
  opts?: {
    method?: string;
    json?: unknown;
    headers?: Record<string, string>;
  },
): Promise<T> {
  const url = `${env.API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;

  // Better Auth Expo plugin stores cookies/session; fetch will include them on native.
  const res = await fetch(url, {
    method: opts?.method ?? (opts?.json ? "POST" : "GET"),
    headers: {
      "Content-Type": "application/json",
      ...(opts?.headers ?? {}),
    },
    body: opts?.json ? JSON.stringify(opts.json) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${text}`);
  }
  return (await res.json()) as T;
}

