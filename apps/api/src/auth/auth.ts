import "../config";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { expo } from "@better-auth/expo";
import { phoneNumber } from "better-auth/plugins";
import { Resend } from "resend";

import { db } from "@/db/client";
import { readEnv } from "@/env";
import * as schema from "@/db/schema";

const env = readEnv();
const resend =
  env.RESEND_API_KEY && env.RESEND_FROM ? new Resend(env.RESEND_API_KEY) : null;

function tempEmailForPhone(phoneNumber: string) {
  const digits = phoneNumber.replace(/\D/g, "") || "unknown";
  return `pn.${digits}@phone.budgetcoach.local`;
}

async function deliverSmsOtp(phoneNumber: string, code: string) {
  const shortBody = `[BudgetCoach] 您的验证码是 ${code}，5 分钟内有效。`;
  const twilioSid = env.TWILIO_ACCOUNT_SID;
  const twilioToken = env.TWILIO_AUTH_TOKEN;
  const twilioFrom = env.TWILIO_FROM;
  if (twilioSid && twilioToken && twilioFrom) {
    const auth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: phoneNumber,
          From: twilioFrom,
          Body: shortBody,
        }),
      }
    );
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Twilio SMS failed: ${res.status} ${t}`);
    }
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[Twilio] SMS sent → ${phoneNumber}`);
    }
    return;
  }

  if (process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.log(`[Better Auth] SMS (dev, no Twilio) → ${phoneNumber}: ${code}`);
    return;
  }

  // eslint-disable-next-line no-console
  console.error(
    "[BudgetCoach] SMS not configured: set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM for production"
  );
  throw new Error("SMS is not configured for this environment");
}

export const auth = betterAuth({
  secret: env.BETTER_AUTH_SECRET ?? "dev-secret-change-me-please",
  baseURL: env.BETTER_AUTH_BASE_URL ?? `http://localhost:${env.PORT}`,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    expo(),
    phoneNumber({
      expiresIn: 300,
      otpLength: 6,
      sendOTP: async ({ phoneNumber: to, code }) => {
        await deliverSmsOtp(to, code);
      },
      sendPasswordResetOTP: async ({ phoneNumber: to, code }) => {
        await deliverSmsOtp(to, code);
      },
      phoneNumberValidator: async (phone) => /^\+[1-9]\d{7,14}$/.test(phone.trim()),
      signUpOnVerification: {
        getTempEmail: tempEmailForPhone,
        getTempName: (phone) => phone.replace(/^\+86/, "") || phone,
      },
    }),
  ],
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // If Resend isn't configured, fall back to logs (dev only).
      if (!resend || !env.RESEND_FROM) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(`[Better Auth] verification email → ${user.email}: ${url}`);
        }
        return;
      }

      const subject = "Verify your email";
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5">
          <h2 style="margin:0 0 12px 0">BudgetCoach</h2>
          <p style="margin:0 0 16px 0">Click the button below to verify your email address.</p>
          <p style="margin:0 0 16px 0">
            <a href="${url}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px">
              Verify email
            </a>
          </p>
          <p style="margin:0;color:#6b7280;font-size:12px">
            If you didn't request this, you can ignore this email.
          </p>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: env.RESEND_FROM,
        to: user.email,
        subject,
        html,
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error("[Resend] failed to send verification email", error);
      } else if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log(
          `[Resend] verification email queued (${data?.id ?? "no-id"}) → ${user.email}`
        );
      }
    },
    sendOnSignUp: true,
    sendOnSignIn: true,
  },
  emailAndPassword: {
    enabled: true,
    // Better Auth defaults to 8, but keep explicit so client + server stay aligned.
    minPasswordLength: 8,
    // 当前环境无法稳定发信时，不要阻塞登录；需要邮箱验证时可再打开并配好 Resend。
    requireEmailVerification: false,
    autoSignIn: false,
    sendResetPassword: async ({ user, url }) => {
      // If Resend isn't configured, fall back to logs (dev only).
      if (!resend || !env.RESEND_FROM) {
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log(`[Better Auth] reset password → ${user.email}: ${url}`);
        }
        return;
      }

      const subject = "Reset your password";
      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height: 1.5">
          <h2 style="margin:0 0 12px 0">BudgetCoach</h2>
          <p style="margin:0 0 16px 0">Click the button below to reset your password.</p>
          <p style="margin:0 0 16px 0">
            <a href="${url}" style="display:inline-block;background:#111827;color:#ffffff;text-decoration:none;padding:10px 14px">
              Reset password
            </a>
          </p>
          <p style="margin:0;color:#6b7280;font-size:12px">
            If you didn't request this, you can ignore this email.
          </p>
        </div>
      `;

      const { data, error } = await resend.emails.send({
        from: env.RESEND_FROM,
        to: user.email,
        subject,
        html,
      });

      if (error) {
        // eslint-disable-next-line no-console
        console.error("[Resend] failed to send reset password email", error);
      } else if (process.env.NODE_ENV !== "production") {
        // eslint-disable-next-line no-console
        console.log(
          `[Resend] reset password email queued (${data?.id ?? "no-id"}) → ${user.email}`
        );
      }
    },
  },
  trustedOrigins: [
    "budgetcoach://",
    "exp://",
    "http://localhost",
    "http://127.0.0.1",
  ],
});

