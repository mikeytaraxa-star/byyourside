/** Serialize device writes and coalesce pending changes to the newest display. */
export function latestUpdateQueue<T>(write: (value: T) => Promise<void>, onError: (error: unknown) => void) {
  let pending: { value: T } | null = null;
  let running = false;
  let active = true;
  const drain = async () => {
    if (running) return;
    running = true;
    try {
      while (active && pending) {
        const value = pending.value;
        pending = null;
        try { await write(value); } catch (error) { if (active) onError(error); }
      }
    } finally { running = false; }
  };
  return {
    push(value: T) { if (!active) return; pending = { value }; void drain(); },
    stop() { active = false; pending = null; },
  };
}