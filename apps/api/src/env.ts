import { z } from 'zod';

const EnvSchema = z.object({
  PORT: z.coerce.number().default(8787),
  DATABASE_URL: z.string().min(10),
  BETTER_AUTH_SECRET: z.string().min(16),
  BETTER_AUTH_BASE_URL: z.string().url().optional(),
  EXPO_ACCESS_TOKEN: z
    .preprocess((v) => (typeof v === 'string' && v.trim() === '' ? undefined : v), z.string().min(10).optional()),
  RESEND_API_KEY: z
    .preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().min(10).optional()),
  // e.g. "BudgetCoach <onboarding@yourdomain.com>"
  RESEND_FROM: z
    .preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), z.string().min(3).optional()),
  WECHAT_APP_ID: z.string().min(5).optional(),
  WECHAT_APP_SECRET: z.string().min(8).optional(),
  WECHAT_REDIRECT_URI: z.string().url().optional(),
  JWT_SECRET: z.string().min(16).optional(), // legacy (to remove after migration)
});

export type Env = z.infer<typeof EnvSchema>;

export function readEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error(parsed.error.flatten());
    throw new Error('Invalid env');
  }
  return parsed.data;
}


