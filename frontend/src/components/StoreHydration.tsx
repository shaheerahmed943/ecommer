"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useCartStore } from "@/store/useCartStore";

export default function StoreHydration() {
  useEffect(() => {
    void useAuthStore.persist.rehydrate();
    void useCartStore.persist.rehydrate();
  }, []);

  return null;
}
