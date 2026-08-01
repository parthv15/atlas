"use client";

import { createContext, type ReactNode, useContext } from "react";

import type { AtlasContextValue } from "@/lib/atlas-context-types";

const AtlasContext = createContext<AtlasContextValue | null>(null);

export function AtlasContextProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: AtlasContextValue;
}) {
  return (
    <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>
  );
}

export function useAtlasContext(): AtlasContextValue {
  const context = useContext(AtlasContext);

  if (!context) {
    throw new Error(
      "useAtlasContext must be used inside an AtlasContextProvider.",
    );
  }

  return context;
}
