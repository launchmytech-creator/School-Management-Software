import { useState, useEffect, useRef, useCallback } from "react";

export interface UseScrollableTabsOptions {
  rightThreshold?: number;
}

export interface UseScrollableTabsResult {
  canScrollLeft: boolean;
  canScrollRight: boolean;
  tabsRef: React.RefObject<HTMLDivElement | null>;
  scrollBy: (direction: "left" | "right", amount?: number) => void;
}

export function useScrollableTabs(
  options: UseScrollableTabsOptions = {}
): UseScrollableTabsResult {
  const { rightThreshold = 10 } = options;
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  const updateScrollState = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - rightThreshold);
  }, [rightThreshold]);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    return () => el.removeEventListener("scroll", updateScrollState);
  }, [updateScrollState]);

  const scrollBy = useCallback(
    (direction: "left" | "right", amount = 300) => {
      const el = tabsRef.current;
      if (!el) return;
      el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
      setTimeout(updateScrollState, 350);
    },
    [updateScrollState]
  );

  return { canScrollLeft, canScrollRight, tabsRef, scrollBy };
}
