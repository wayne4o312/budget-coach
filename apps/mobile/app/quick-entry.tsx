import { router, useLocalSearchParams } from "expo-router";

import { QuickEntryContent } from "@/components/quick-entry/QuickEntryContent";

/** 与根 Stack `fullScreenModal` 一致；勿再在页内包 RN Modal，避免布局与独立打开时不一致。 */
export default function QuickEntryScreen() {
  const params = useLocalSearchParams<{ category?: string; kind?: string }>();
  const category =
    typeof params.category === "string" && params.category.length > 0
      ? params.category
      : "未分类";
  const kind: "expense" | "income" =
    params.kind === "income" ? "income" : "expense";

  return (
    <QuickEntryContent
      category={category}
      kind={kind}
      onClose={() => router.back()}
    />
  );
}
