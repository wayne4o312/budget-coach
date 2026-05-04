import { StyleSheet } from "react-native";

import { fonts } from "@/src/theme/rn";
import { Palette } from "@/src/theme/palette";

/** 今日 Tab：样式文件必须在 app/ 外，否则 expo-router 会当作路由扫描 */
export const todayStyles = StyleSheet.create({
  scrollPad: { paddingHorizontal: 20 },
  stackGap16: { gap: 16 },
  stackGap6: { gap: 6 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dateEyebrow: {
    fontSize: 12,
    letterSpacing: 1.6,
  },
  fabCircle: {
    height: 40,
    width: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  dateBarPress: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  dateBarText: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: "rgba(18,22,16,0.78)",
  },
  heroGlass: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20 },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  heroLeft: { flex: 1, gap: 4 },
  heroEyebrow: {
    fontSize: 12,
    letterSpacing: 1.4,
    fontFamily: fonts.sansMedium,
  },
  heroBaseline: { flexDirection: "row", alignItems: "baseline" },
  heroYuan: {
    fontSize: 18,
    lineHeight: 26,
    marginRight: 2,
  },
  heroBigAmt: {
    textAlign: "left",
    fontSize: 34,
    lineHeight: 38,
    letterSpacing: -0.8,
  },
  spacer12: { height: 12 },
  heroSmallAmt: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.2,
    textAlign: "left",
  },
  budgetSetupLink: {
    fontSize: 13,
    lineHeight: 18,
    fontFamily: fonts.sansMedium,
    color: Palette.authInk,
    textDecorationLine: "underline",
    textDecorationColor: Palette.authHairline,
  },
  ringCol: { alignItems: "center", justifyContent: "center" },
  ringCaption: {
    marginTop: 8,
    fontSize: 11,
    letterSpacing: 1.6,
  },
  listGap: { gap: 8 },
  emptyPad: { paddingHorizontal: 8, paddingVertical: 40 },
  emptyCenter: { alignItems: "center" },
  emptyTitle: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
    color: "rgba(15,18,14,0.46)",
  },
  emptySub: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 16,
    color: "rgba(15,18,14,0.40)",
  },
  swipeDelHit: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  swipeDelText: { fontSize: 15, fontFamily: fonts.sansMedium, color: "#fff" },
  txRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  txCat: {
    paddingRight: 12,
    fontSize: 16,
    fontFamily: fonts.sansMedium,
    color: "rgba(18,22,16,0.84)",
    flexShrink: 1,
  },
  txAmtExpense: {
    flexShrink: 0,
    fontSize: 17,
    letterSpacing: -0.3,
    color: "#047857",
  },
  txAmtIncome: {
    flexShrink: 0,
    fontSize: 17,
    letterSpacing: -0.3,
    color: "#b91c1c",
  },
});
