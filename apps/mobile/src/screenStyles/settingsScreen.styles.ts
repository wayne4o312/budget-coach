import { StyleSheet } from "react-native";

import { ui, fonts, hairline } from "@/src/theme/rn";

export const settingsStyles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: ui.background },
  scrollContent: { paddingHorizontal: 24, paddingVertical: 24 },
  stackGap6: { gap: 24 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  rowTitle: { fontSize: 14, fontFamily: fonts.sansBold, color: ui.text },
  rowSubtitle: { marginTop: 2, fontSize: 12 },
  rowLeft: { minWidth: 0, flex: 1 },
  sectionGap: { gap: 8 },
  sectionLabel: {
    paddingHorizontal: 4,
    fontSize: 11,
    letterSpacing: 1.2,
  },
  sectionCard: {
    borderRadius: 0,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.card,
  },
  hairline: { height: hairline, backgroundColor: ui.border },
  badgeMuted: { fontSize: 11, letterSpacing: 1 },
  backPress: { alignItems: "center", paddingVertical: 8 },
  backText: { fontSize: 12 },
  reminderTools: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  stepperBtn: {
    minWidth: 40,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: ui.border,
    backgroundColor: ui.background,
    alignItems: "center",
  },
  stepperVal: { fontSize: 16, fontFamily: fonts.sansMedium, color: ui.text },
});
