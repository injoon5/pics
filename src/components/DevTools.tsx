"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { hydrateSoundFromStorage } from "@/store/ui";

const DialKitMount =
  process.env.NODE_ENV === "development"
    ? dynamic(() => import("./DialKitMount"), { ssr: false })
    : null;

export function DevTools() {
  useEffect(() => {
    hydrateSoundFromStorage();
  }, []);

  if (!DialKitMount) return null;
  return <DialKitMount />;
}
