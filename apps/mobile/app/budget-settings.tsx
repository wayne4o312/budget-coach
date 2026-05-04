import { Stack, router } from "expo-router";

import { AuroraBackground } from "@/components/ui/aurora-background";
import { BudgetSettingsForm } from "@/components/home/BudgetSettingsForm";

export default function BudgetSettingsScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "预算设置",
          headerShadowVisible: false,
        }}
      />
      <AuroraBackground variant="clean" decorations={false}>
        <BudgetSettingsForm
          onSaved={() => router.back()}
        />
      </AuroraBackground>
    </>
  );
}
