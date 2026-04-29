import type * as React from "react";
import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Platform, Pressable, View } from "react-native";
import { Portal } from "@rn-primitives/portal";
import { Text } from "@/components/ui/text";

type ToastVariant = "default" | "error";

type ToastItem = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (message: string, opts?: { variant?: ToastVariant; durationMs?: number }) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function genId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastItem | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    setToast(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const showToast = useCallback(
    (message: string, opts?: { variant?: ToastVariant; durationMs?: number }) => {
      const variant = opts?.variant ?? "default";
      const durationMs = opts?.durationMs ?? 2400;
      setToast({ id: genId(), message, variant });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => hide(), durationMs);
    },
    [hide],
  );

  const value = useMemo<ToastContextValue>(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Portal name="toast">
        {toast ? (
          <View
            pointerEvents="box-none"
            className="absolute left-0 right-0 top-0"
            style={{
              paddingTop: Platform.OS === "ios" ? 52 : 24,
              paddingHorizontal: 16,
            }}
          >
            <Pressable
              onPress={hide}
              className={`w-full rounded-lg px-4 py-3 ${
                toast.variant === "error" ? "bg-destructive" : "bg-foreground"
              }`}
              style={{
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }}
            >
              <Text
                className={`text-sm ${
                  toast.variant === "error" ? "text-white" : "text-background"
                }`}
              >
                {toast.message}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </Portal>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

