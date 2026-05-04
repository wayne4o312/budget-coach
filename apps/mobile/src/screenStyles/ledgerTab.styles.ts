import { StyleSheet } from "react-native";

import { fonts } from "@/src/theme/rn";

export const ledgerStyles = StyleSheet.create({
  segmentGlass: {
    padding: 4,
    borderRadius: 16,
    overflow: "hidden",
  },
  segmentRow: {
    position: "relative",
    flexDirection: "row",
  },
  segmentHit: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  segmentLabel: {
    fontSize: 13,
  },
  rootColumn: {
    flex: 1,
    paddingHorizontal: 20,
  },
  scroll: {
    flex: 1,
  },
  stackGap16: { gap: 16 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  navRoundBtn: {
    height: 36,
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(236,223,205,0.35)",
  },
  rangeTitle: {
    fontSize: 14,
    fontFamily: fonts.sansMedium,
    color: "rgba(28,24,20,0.9)",
  },
  glassPad20: { paddingHorizontal: 20, paddingVertical: 20 },
  glassPad16: { paddingHorizontal: 16, paddingVertical: 16 },
  glassPad16TopWide: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  cardStackGap12: { gap: 12 },
  sectionEyebrow: {
    fontSize: 12,
    letterSpacing: 1.4,
    fontFamily: fonts.sansMedium,
    color: "rgba(15,18,14,0.54)",
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
  },
  summaryCol: { flex: 1 },
  summaryLabel: { fontSize: 12, color: "rgba(15,18,14,0.50)" },
  summaryValue: {
    marginTop: 4,
    fontSize: 18,
    fontFamily: fonts.sansMedium,
    color: "rgba(18,22,16,0.90)",
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fonts.sansMedium,
    color: "rgba(28,24,20,0.9)",
  },
  errorText: { marginTop: 4, fontSize: 12, color: "#b45350" },
  mutedSmall: { marginTop: 16, fontSize: 12, lineHeight: 16 },
  chartWrap: { marginTop: 16 },
  tickLabel: { fontSize: 10, color: "rgba(15,18,14,0.44)" },
  loadingCapsuleText: { fontSize: 12, color: "rgba(15,18,14,0.52)" },
  placeholderTrend: {
    marginTop: 16,
    height: 128,
    borderRadius: 12,
    backgroundColor: "rgba(236,223,205,0.25)",
  },
  chipRow: {
    marginTop: 12,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  chipBase: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipOn: { backgroundColor: "rgba(236,223,205,0.6)" },
  chipOff: { backgroundColor: "rgba(236,223,205,0.25)" },
  chipLabel: { fontSize: 12, color: "rgba(28,24,20,0.85)" },
  pieOuter: { marginTop: 16, alignItems: "center", justifyContent: "center" },
  legendWrap: { marginTop: 16, width: "100%", gap: 10, paddingHorizontal: 4 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  legendLeft: {
    minWidth: 0,
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendName: { fontSize: 12, color: "rgba(28, 32, 38, 0.78)" },
  legendAmt: {
    fontSize: 12,
    color: "rgba(28, 32, 38, 0.68)",
  },
  placeholderPie: {
    marginTop: 16,
    height: 160,
    borderRadius: 12,
    backgroundColor: "rgba(236,223,205,0.25)",
  },
});
