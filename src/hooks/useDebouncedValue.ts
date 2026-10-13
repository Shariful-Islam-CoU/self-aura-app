import { useEffect, useState } from 'react';

/**
 * Returns `value` after it has been stable for `delayMs` (default 400 ms).
 * Used for search inputs so typing never fires a request per keystroke;
 * the timer resets on every change, so exactly one request goes out when
 * the user pauses.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
