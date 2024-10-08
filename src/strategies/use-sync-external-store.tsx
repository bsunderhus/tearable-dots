import { useCallback, useSyncExternalStore } from "react";

const store = {
  color: "red",
};

const listeners = new Set();

export const useChangeHandler = () => {
  return (redOrBlue: "red" | "blue") => {
    store.color = redOrBlue;
    Array.from(listeners).forEach((listener: any) => listener());
  };
};

export const useColor = () => {
  const syncColor = useSyncExternalStore(
    useCallback((listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }, []),
    useCallback(() => store.color, [])
  );

  return syncColor;
};

export const useUnsafeChangeHandler = () => {
  return (redOrBlue: "red" | "blue") => {
    store.color = redOrBlue;
  };
};
