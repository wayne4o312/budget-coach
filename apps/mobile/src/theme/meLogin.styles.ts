import { StyleSheet } from "react-native";

import { Palette } from "@/src/theme/palette";
import { fonts, ui } from "@/src/theme/rn";

export const meLoginStyles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  loggedOutColumn: {
    flex: 1,
    justifyContent: "center",
    gap: 40,
  },
  title: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 1.6,
    color: Palette.foreground,
  },
  /** 全屏表单顶栏 */
  modalHeader: {
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalClose: {
    fontSize: 15,
    fontWeight: "500",
    color: Palette.foregroundMuted,
  },
  modalTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 1.2,
    color: Palette.foreground,
  },
  modalHeaderSpacer: { width: 56 },
  fieldColumn: {
    gap: 16,
  },
  /** 与登录区字段标题一致，用于预算等全宽表单 */
  formFieldLabel: {
    fontSize: 12,
    letterSpacing: 0.5,
    fontWeight: "500",
    color: Palette.foregroundMuted,
  },
  formFieldHint: {
    fontSize: 11,
    lineHeight: 16,
    color: Palette.foregroundMuted,
  },
  hintRow: {
    gap: 8,
  },
  phoneRow: {
    height: 48,
    width: "100%",
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 0,
    backgroundColor: ui.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.border,
    paddingLeft: 12,
    paddingRight: 0,
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    alignSelf: "stretch",
    paddingVertical: 0,
    paddingHorizontal: 0,
    margin: 0,
    borderWidth: 0,
    borderRadius: 0,
    backgroundColor: "transparent",
    fontSize: 15,
    color: Palette.foreground,
  },
  /** 固定宽度，避免「可点 / 不可点」切换时仅换色却改变布局 */
  otpInlineBtn: {
    width: 108,
    flexShrink: 0,
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    borderRadius: 0,
    alignSelf: "stretch",
    overflow: "hidden",
    position: "relative",
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: ui.border,
  },
  otpInlineLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  otpInlineLabelWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  /** 全宽主 CTA 文字层，勿加左右 padding 以免与历史版心不一致 */
  primaryCtaLabelWrap: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  otpInlineLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  otpField: {
    height: 48,
    width: "100%",
    borderRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: ui.border,
    paddingHorizontal: 16,
    paddingVertical: 0,
    fontSize: 15,
    backgroundColor: ui.card,
    color: Palette.foreground,
  },
  actionsColumn: {
    gap: 24,
  },
  primaryBtn: {
    height: 48,
    width: "100%",
    flexDirection: "column",
    alignItems: "stretch",
    justifyContent: "center",
    borderRadius: 0,
    overflow: "hidden",
    position: "relative",
  },
  primaryLabel: {
    fontSize: 15,
    fontWeight: "500",
    textAlign: "center",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: Palette.authHairline,
  },
  joinLabel: {
    fontSize: 10,
    letterSpacing: 1,
    color: Palette.foregroundMuted,
  },
  wechatBtn: {
    height: 48,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 0,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Palette.authSocialRing,
    backgroundColor: Palette.authSocialFill,
  },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  checkbox: {
    marginTop: 2,
    height: 18,
    width: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 0,
  },
  checkboxOn: {
    borderColor: "#000",
    backgroundColor: "#000",
  },
  checkboxOff: {
    borderColor: "rgba(255,255,255,0.4)",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 20,
    color: Palette.foregroundMuted,
  },
  termsLink: {
    color: Palette.foreground,
    textDecorationLine: "underline",
  },
  signOutBtn: {
    height: 48,
    width: "100%",
    flexDirection: "column",
    borderRadius: 0,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  signOutLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fcf9f4",
    textAlign: "center",
  },
});

/** 我的页：已登录区 + 顶栏 */
export const meScreenStyles = StyleSheet.create({
  headerBar: {
    marginBottom: 24,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  spacerW40: { width: 40 },
  brandTiny: {
    textAlign: "center",
    fontSize: 12,
    letterSpacing: 1.6,
    color: "rgba(15,18,14,0.52)",
  },
  gearHit: {
    height: 40,
    width: 40,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  loggedInWrap: { gap: 24 },
  profileBlock: { alignItems: "center", gap: 12 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: ui.backgroundMuted,
  },
  accountTitle: {
    textAlign: "center",
    fontSize: 18,
    fontFamily: fonts.sans,
    letterSpacing: 0.2,
    color: Palette.foreground,
  },
  userIdMuted: { textAlign: "center", fontSize: 12 },
  glassPad16: { paddingHorizontal: 16, paddingVertical: 16 },
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1.2,
  },
  streakNumber: {
    marginTop: 8,
    textAlign: "left",
    fontSize: 22,
    lineHeight: 28,
    fontFamily: fonts.sans,
    color: Palette.foreground,
  },
  sectionFoot: { marginTop: 4, fontSize: 12 },
  unlockedList: { marginTop: 12, gap: 8 },
  bulletMuted: { fontSize: 12 },
});
