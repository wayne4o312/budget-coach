import { LinearGradient } from "expo-linear-gradient";
import type { PropsWithChildren } from "react";
import { useEffect } from "react";
import { View, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Path, Stop } from "react-native-svg";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

type AuroraBackgroundProps = PropsWithChildren<{
  style?: ViewStyle | ViewStyle[];
  /** 主页装饰：波纹线、星光点、流光动画。其它页面可关掉保持干净。 */
  decorations?: boolean;
  /** clean：只有奶油米绿底色（无半圆光斑/无装饰）；home：完整极光+装饰 */
  variant?: "home" | "clean";
}>;

export function AuroraBackground({
  children,
  style,
  decorations = true,
  variant = "home",
}: AuroraBackgroundProps) {
  const isClean = variant === "clean";
  const t = useSharedValue(0);

  useEffect(() => {
    if (!decorations || isClean) return;
    t.value = withRepeat(
      withTiming(1, { duration: 14000, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [decorations, isClean, t]);

  const auroraMotion = useAnimatedStyle(() => {
    if (!decorations || isClean) return { opacity: 0 };
    const dx = interpolate(t.value, [0, 1], [0, -26]);
    const dy = interpolate(t.value, [0, 1], [0, 18]);
    const o = interpolate(t.value, [0, 1], [0.78, 0.92]);
    return { transform: [{ translateX: dx }, { translateY: dy }], opacity: o };
  });

  const waveShimmerMotion = useAnimatedStyle(() => {
    if (!decorations || isClean) return { opacity: 0 };
    const x = interpolate(t.value, [0, 1], [-40, 80]);
    const o = interpolate(t.value, [0, 1], [0.0, 0.22]);
    return { transform: [{ translateX: x }], opacity: o };
  });

  return (
    <View style={[{ flex: 1 }, style]}>
      {/* 奶油米绿色基底 */}
      <LinearGradient
        colors={[
          "rgba(232, 243, 228, 1)", // warm mint
          "rgba(246, 244, 235, 1)", // creamy beige
          "rgba(223, 238, 225, 1)", // soft green
        ]}
        start={{ x: 0.2, y: 0.05 }}
        end={{ x: 0.8, y: 0.95 }}
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        }}
      />

      {/* 极光光晕：右上角黄绿色渐变光斑 */}
      {!isClean ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: -120,
              right: -140,
              width: 420,
              height: 420,
              borderRadius: 210,
            },
            auroraMotion,
          ]}
        >
          <LinearGradient
            colors={[
              "rgba(209, 236, 156, 0.82)",
              "rgba(252, 235, 170, 0.48)",
              "rgba(209, 236, 156, 0.00)",
            ]}
            start={{ x: 0.1, y: 0.1 }}
            end={{ x: 0.9, y: 0.9 }}
            style={{ width: "100%", height: "100%", borderRadius: 210 }}
          />
        </Animated.View>
      ) : null}

      {/* 远处柔光 bloom（做“空气感”） */}
      {!isClean ? (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            bottom: -180,
            left: -160,
            width: 480,
            height: 480,
            borderRadius: 240,
            backgroundColor: "rgba(168, 205, 190, 0.20)",
            shadowColor: "rgba(120, 185, 160, 1)",
            shadowOpacity: 0.16,
            shadowRadius: 54,
            shadowOffset: { width: 0, height: 20 },
          }}
        />
      ) : null}

      {/* 波纹线 + 星光点缀（绝对定位覆盖层） */}
      {decorations && !isClean ? (
        <View
          pointerEvents="none"
          style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <Svg
            width="100%"
            height="100%"
            viewBox="0 0 390 844"
            preserveAspectRatio="none"
          >
            <Defs>
              <SvgGradient id="wave" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="rgba(255,255,255,0.00)" />
                <Stop offset="0.35" stopColor="rgba(255,255,255,0.22)" />
                <Stop offset="0.65" stopColor="rgba(255,255,255,0.16)" />
                <Stop offset="1" stopColor="rgba(255,255,255,0.00)" />
              </SvgGradient>
              <SvgGradient id="wave2" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="rgba(255,255,255,0.00)" />
                <Stop offset="0.45" stopColor="rgba(255,255,255,0.14)" />
                <Stop offset="1" stopColor="rgba(255,255,255,0.00)" />
              </SvgGradient>
              {/* 流光扫过波纹线的高光渐变 */}
              <SvgGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0" stopColor="rgba(255,255,255,0.00)" />
                <Stop offset="0.48" stopColor="rgba(255,255,255,0.34)" />
                <Stop offset="0.56" stopColor="rgba(255,255,255,0.08)" />
                <Stop offset="1" stopColor="rgba(255,255,255,0.00)" />
              </SvgGradient>
            </Defs>

          {/* 三组柔和细线波浪（轻微不同位置/透明度） */}
          <Path
            d="M-20 260 C 40 236, 96 280, 158 256 C 224 230, 280 272, 344 252 C 392 238, 420 244, 430 248"
            stroke="url(#wave)"
            strokeWidth={1}
            opacity={0.55}
            fill="none"
          />
          <Path
            d="M-30 310 C 32 286, 108 328, 182 302 C 248 278, 306 320, 378 296 C 418 282, 444 288, 456 294"
            stroke="url(#wave2)"
            strokeWidth={1}
            opacity={0.42}
            fill="none"
          />
          <Path
            d="M-24 368 C 44 344, 118 392, 192 366 C 262 342, 322 388, 392 362 C 432 348, 456 354, 470 360"
            stroke="url(#wave)"
            strokeWidth={1}
            opacity={0.32}
            fill="none"
          />

          {/* 星光点缀：右上角几个细小金色光点 */}
          <Circle cx="320" cy="104" r="1.8" fill="rgba(214, 176, 96, 0.80)" />
          <Circle cx="336" cy="92" r="1.2" fill="rgba(214, 176, 96, 0.72)" />
          <Circle cx="352" cy="110" r="1.4" fill="rgba(214, 176, 96, 0.62)" />
          <Circle cx="340" cy="128" r="1.0" fill="rgba(214, 176, 96, 0.56)" />
          <Circle cx="366" cy="96" r="0.9" fill="rgba(214, 176, 96, 0.50)" />
          </Svg>

        {/* 流光层：在波纹位置再叠一层高光线，并做缓慢平移 */}
          <Animated.View
            pointerEvents="none"
            style={[
              { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 },
              waveShimmerMotion,
            ]}
          >
            <Svg
              width="100%"
              height="100%"
              viewBox="0 0 390 844"
              preserveAspectRatio="none"
            >
              <Path
                d="M-20 260 C 40 236, 96 280, 158 256 C 224 230, 280 272, 344 252 C 392 238, 420 244, 430 248"
                stroke="url(#shimmer)"
                strokeWidth={1}
                opacity={0.8}
                fill="none"
              />
              <Path
                d="M-30 310 C 32 286, 108 328, 182 302 C 248 278, 306 320, 378 296 C 418 282, 444 288, 456 294"
                stroke="url(#shimmer)"
                strokeWidth={1}
                opacity={0.55}
                fill="none"
              />
              <Path
                d="M-24 368 C 44 344, 118 392, 192 366 C 262 342, 322 388, 392 362 C 432 348, 456 354, 470 360"
                stroke="url(#shimmer)"
                strokeWidth={1}
                opacity={0.40}
                fill="none"
              />
            </Svg>
          </Animated.View>
        </View>
      ) : null}

      {children}
    </View>
  );
}

