'use client';

import { useState } from 'react';

export function useFullscreenScanner() {
  const [open, setOpen] = useState(false);
  const [resolver, setResolver] = useState<((v: string) => void) | null>(null);

  function startScan(): Promise<string> {
    return new Promise((resolve) => {
      setResolver(() => resolve);
      setOpen(true);
    });
  }

  function handleResult(ean: string) {
    if (resolver) resolver(ean);
    setOpen(false);
  }

  return {
    open,
    startScan,
    handleResult,
    close: () => setOpen(false)
  };
}
