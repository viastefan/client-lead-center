"use client";

import { useMemo, useSyncExternalStore } from "react";
import { mergeDirectory } from "./directory";
import { EMPTY_LOCAL, readLocalCustomers, subscribeLocalCustomers } from "./store";
import type { DirectoryCustomer } from "./types";

export function useDirectory(server: DirectoryCustomer[] = []): DirectoryCustomer[] {
  const local = useSyncExternalStore(subscribeLocalCustomers, readLocalCustomers, () => EMPTY_LOCAL);
  return useMemo(() => mergeDirectory(local, server), [local, server]);
}
