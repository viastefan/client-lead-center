"use client";

import { Suspense } from "react";
import { ReminderBoard } from "@/components/ops/reminder-board";

export default function RemindersPage() {
  return (
    <Suspense fallback={<div className="glass h-40 animate-pulse rounded-lg" />}>
      <ReminderBoard />
    </Suspense>
  );
}
