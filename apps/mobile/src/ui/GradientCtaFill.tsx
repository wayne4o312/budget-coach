import type { PropsWithChildren } from "react";
import { StyleSheet, View } from "react-native";

import { ui } from "@/src/theme/rn";

/**
 * 主 CTA 实色底（品牌主色），铺满父级（父级需 `overflow: "hidden"`；主按钮请给固定 height 或 flex）。
 */
export function GradientCtaFill({ children }: PropsWithChildren) {
  return (
    <View style={styles.wrap}>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFillObject, { backgroundColor: ui.primary }]}
      />
      <View pointerEvents="box-none" style={styles.fg}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignSelf: "stretch",
    width: "100%",
    minHeight: 0,
    overflow: "hidden",
  },
  fg: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
});
