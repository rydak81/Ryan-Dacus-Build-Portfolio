'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Mounts children when the container approaches the viewport. Used on the
 * home page so the copula simulation doesn't run during initial hydration —
 * it starts as the visitor scrolls toward it. minHeight reserves roughly
 * the widget's footprint so mounting doesn't shift the layout.
 */
export default function DeferredMount({
  minHeight,
  children,
}: {
  minHeight: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setShow(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: '200px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} style={show ? undefined : { minHeight }}>
      {show ? children : null}
    </div>
  );
}
