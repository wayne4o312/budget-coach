/**
 * 与 Tailwind/CSS 变量解耦的实色表。
 * 登录等关键 UI 请用 StyleSheet + 这里的值，避免 NativeWind 对任意色 / 透明度编译不稳定。
 */
export const Palette = {
  foreground: "#1c1814",
  foregroundMuted: "rgba(28, 24, 20, 0.55)",
  destructive: "#b45350",

  /** 主按钮、获取验证码（可用）— 浅一档的暖灰褐，避免近黑压屏 */
  authInk: "#96897c",
  /** 分隔线 */
  authHairline: "rgba(208, 190, 170, 0.85)",
  /** 微信按钮圈 */
  authSocialRing: "rgba(255, 255, 255, 0.35)",
  authSocialFill: "rgba(255, 255, 255, 0.14)",
} as const;
