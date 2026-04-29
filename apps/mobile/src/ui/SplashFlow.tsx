import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, StyleSheet, View } from "react-native";

const FRAMES = [
  require("../../assets/splash/splash-01.png"),
  require("../../assets/splash/splash-02.png"),
  require("../../assets/splash/splash-03.png"),
  require("../../assets/splash/splash-04.png"),
  require("../../assets/splash/splash-05.png"),
  require("../../assets/splash/splash-06.png"),
  require("../../assets/splash/splash-07.png"),
  require("../../assets/splash/splash-08.png"),
  require("../../assets/splash/splash-09.png"),
  require("../../assets/splash/splash-10.png"),
] as const;

export function SplashFlow(props: {
  start: boolean;
  onDone: () => void;
  frameMs?: number;
  fadeMs?: number;
}) {
  const frameMs = props.frameMs ?? 320;
  const fadeMs = Math.min(props.fadeMs ?? 180, frameMs);
  const onDone = props.onDone;
  const [idx, setIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;

  const source = useMemo(() => {
    return FRAMES[Math.min(idx, FRAMES.length - 1)];
  }, [idx]);

  useEffect(() => {
    if (!props.start) return;
    if (timerRef.current) return;

    timerRef.current = setInterval(() => {
      setIdx((prev) => {
        const next = prev + 1;
        if (next >= FRAMES.length) return prev;
        return next;
      });
    }, frameMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [frameMs, props.start]);

  useEffect(() => {
    if (!props.start) return;
    if (idx === 0) {
      opacity.setValue(1);
      return;
    }
    opacity.stopAnimation();
    opacity.setValue(1);
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 0,
        duration: Math.floor(fadeMs * 0.45),
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: Math.floor(fadeMs * 0.55),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeMs, idx, opacity, props.start]);

  useEffect(() => {
    if (!props.start) return;
    if (idx < FRAMES.length - 1) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;

    const t = setTimeout(() => onDone(), 180);
    return () => clearTimeout(t);
  }, [idx, onDone, props.start]);

  return (
    <View pointerEvents="none" style={styles.root}>
      <Animated.Image
        source={source}
        style={[styles.img, { opacity }]}
        resizeMode="cover"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#2EE67A",
  },
  img: {
    width: "100%",
    height: "100%",
  },
});
