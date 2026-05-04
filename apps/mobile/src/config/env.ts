function getEnv(name: string): string | undefined {
  // Expo: EXPO_PUBLIC_* are exposed to the app bundle
  const env = process.env as Record<string, string | undefined>;
  return env?.[name];
}

export const env = {
  API_BASE_URL: getEnv('EXPO_PUBLIC_API_BASE_URL') ?? 'http://localhost:8787',
  APP_SCHEME: getEnv('EXPO_PUBLIC_APP_SCHEME') ?? 'budgetcoach',
  WECHAT_APP_ID: getEnv('EXPO_PUBLIC_WECHAT_APP_ID'),
  /** EAS 工程 UUID，`eas init` / `app.json` → `expo.extra.eas.projectId` 二选一 */
  EAS_PROJECT_ID: getEnv('EXPO_PUBLIC_EAS_PROJECT_ID'),
};

