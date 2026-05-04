import * as SeparatorPrimitive from "@rn-primitives/separator";
import * as React from "react";
import { StyleSheet } from "react-native";

import { ui } from "@/src/theme/rn";

function Separator({
  style,
  orientation = "horizontal",
  decorative = true,
  ...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
  return (
    <SeparatorPrimitive.Root
      decorative={decorative}
      orientation={orientation}
      style={[
        {
          flexShrink: 0,
          backgroundColor: ui.border,
        },
        orientation === "horizontal"
          ? { height: StyleSheet.hairlineWidth, width: "100%" }
          : { width: StyleSheet.hairlineWidth, height: "100%" },
        style,
      ]}
      {...props}
    />
  );
}

export { Separator };
