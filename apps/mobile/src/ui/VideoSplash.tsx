import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Image, StyleSheet, View } from "react-native";
import { VideoView, useVideoPlayer } from "expo-video";
import type { VideoPlayer } from "expo-video";
import type { StatusChangeEventPayload } from "expo-video";

export function VideoSplash(props: {
  start: boolean;
  onReady?: () => void;
  onDone: () => void;
}) {
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const readyNotifiedRef = useRef(false);

  const source = useMemo(() => {
    return require("../../assets/splash/screen.mp4");
  }, []);

  const cover = useMemo(() => {
    return require("../../assets/splash/splash-01.png");
  }, []);

  const player: VideoPlayer = useVideoPlayer(source, (p) => {
    p.loop = false;
    p.muted = true;
  });

  const finish = useCallback(() => {
    if (done) return;
    setDone(true);
    props.onDone();
  }, [done, props]);

  useEffect(() => {
    // `expo-video` emits `playToEnd` when playback ends.
    const sub = player.addListener("playToEnd", finish);
    return () => {
      sub.remove();
    };
  }, [finish, player]);

  useEffect(() => {
    const sub = player.addListener(
      "statusChange",
      (e: StatusChangeEventPayload) => {
        if (e?.status === "readyToPlay") {
          setReady(true);
        }
      }
    );
    return () => sub.remove();
  }, [player]);

  useEffect(() => {
    if (!ready) return;
    if (readyNotifiedRef.current) return;
    readyNotifiedRef.current = true;
    props.onReady?.();
  }, [props, ready]);

  useEffect(() => {
    if (!props.start || done) {
      player.pause?.();
      return;
    }
    player.replay?.();
  }, [done, player, props.start]);

  return (
    <View pointerEvents="none" style={styles.root}>
      {!ready ? (
        <Image source={cover} style={styles.cover} resizeMode="cover" />
      ) : null}
      <VideoView style={styles.video} player={player} contentFit="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#2EE67A",
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },
  video: {
    width: "100%",
    height: "100%",
  },
});
