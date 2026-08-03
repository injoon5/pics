"use client";

import { DialRoot } from "dialkit";
import "dialkit/styles.css";
import { DialHarness } from "@/components/DialHarness";

export default function DialKitMount() {
  return (
    <>
      <DialHarness />
      <DialRoot />
    </>
  );
}
