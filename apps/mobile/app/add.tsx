import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import type { SceneId } from '@/src/domain/scenes';
import { DEFAULT_SCENES } from '@/src/domain/scenes';

export default function AddScreen() {
  const params = useLocalSearchParams<{
    scene?: string;
    title?: string;
    icon?: string;
    category?: string;
    suggested?: string;
  }>();
  const scene = (params.scene as SceneId | undefined) ?? undefined;
  const template = scene ? DEFAULT_SCENES.find((s) => s.id === scene) : undefined;
  const customTitle = typeof params.title === 'string' ? params.title : undefined;
  const suggestedFromParams =
    typeof params.suggested === 'string' && params.suggested.length > 0
      ? params.suggested
          .split(',')
          .map((x) => Number(x.trim()))
          .filter((n) => Number.isFinite(n) && n > 0)
          .map((n) => Math.round(n))
      : undefined;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>新增一笔</Text>
      <Text style={styles.subtitle}>
        场景：
        {template
          ? `${template.icon} ${template.title}`
          : customTitle
            ? customTitle
            : '未指定'}
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>快速金额</Text>
        <View style={styles.row}>
          {(template?.suggestedAmounts ??
            suggestedFromParams ??
            [10, 20, 30, 50]).map((amt) => (
            <Pressable key={amt} style={styles.pill}>
              <Text style={styles.pillText}>¥{amt}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>返回</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 10 },
  title: { fontSize: 22, fontWeight: '800' },
  subtitle: { opacity: 0.75 },
  card: { padding: 14, borderRadius: 16, gap: 10 },
  cardTitle: { fontWeight: '700' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pill: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(120,120,120,0.25)',
  },
  pillText: { fontWeight: '700' },
  backBtn: { marginTop: 'auto', paddingVertical: 14, alignItems: 'center' },
  backText: { fontWeight: '700' },
});

