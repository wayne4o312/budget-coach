import { createAuthClient } from "better-auth/client";
import { expoClient } from "@better-auth/expo/client";
import * as SecureStore from "expo-secure-store";

import { env } from "@/src/config/env";

type AuthClient = ReturnType<typeof createAuthClient>;

const BASE_PREFIX = "budgetcoach";

let activeStoragePrefix = BASE_PREFIX;
let activeClient: AuthClient | null = null;

function createClient(storagePrefix: string) {
  return createAuthClient({
    baseURL: env.API_BASE_URL,
    plugins: [
      expoClient({
        scheme: env.APP_SCHEME,
        storagePrefix,
        storage: SecureStore,
      }),
    ],
  });
}

export function getAuthClient(): AuthClient {
  if (!activeClient) activeClient = createClient(activeStoragePrefix);
  return activeClient;
}

export function getActiveStoragePrefix() {
  return activeStoragePrefix;
}

export function setActiveStoragePrefix(prefix: string) {
  if (!prefix || prefix === activeStoragePrefix) return;
  activeStoragePrefix = prefix;
  activeClient = createClient(activeStoragePrefix);
}


