import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import "react-native-gesture-handler";
import "react-native-reanimated";
import "../global.css";
import { PortalHost } from "@rn-primitives/portal";
import { ToastProvider } from "@/src/ui/toast";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { VideoSplash } from "@/src/ui/VideoSplash";

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import {
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
} from "@expo-google-fonts/cormorant-garamond";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useColorScheme } from "@/components/useColorScheme";
import { DbProvider } from "@/src/db/DbProvider";
import { initNotificationRouting } from "@/src/notifications/notificationRouting";
import { hydrateActiveAccountFromStorage } from "@/src/auth/accounts";

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from "expo-router";

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    "DINPro-Light": require("../assets/fonts/DINPro-Light.otf"),
    "DINPro-Regular": require("../assets/fonts/DINPro-Regular.otf"),
    "DINPro-Medium": require("../assets/fonts/DINPro-Medium.otf"),
    "DINPro-Bold": require("../assets/fonts/DINPro-Bold.otf"),
    "DINPro-Black": require("../assets/fonts/DINPro-Black.otf"),
    "DIN-Bold": require("../assets/fonts/DIN-Bold.otf"),
    "DIN-BoldItalicAlt": require("../assets/fonts/DIN-BoldItalicAlt.otf"),
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_800ExtraBold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    ...FontAwesome.font,
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    initNotificationRouting();
  }, []);

  const [authHydrated, setAuthHydrated] = useState(false);
  useEffect(() => {
    hydrateActiveAccountFromStorage()
      .catch(() => {})
      .finally(() => setAuthHydrated(true));
  }, []);

  const [flowDone, setFlowDone] = useState(false);
  const flowStart = loaded && authHydrated;

  if (!flowStart) {
    // Keep native splash visible until we're ready.
    return null;
  }

  return (
    <>
      <RootLayoutNav />
      {!flowDone ? (
        <VideoSplash
          start={flowStart}
          onReady={() => SplashScreen.hideAsync()}
          onDone={() => setFlowDone(true)}
        />
      ) : null}
    </>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <DbProvider>
        <ToastProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="modal"
                  options={{ presentation: "modal" }}
                />
              </Stack>
              <PortalHost />
            
          </ThemeProvider>
        </ToastProvider>
      </DbProvider>
    </GestureHandlerRootView>
  );
}
