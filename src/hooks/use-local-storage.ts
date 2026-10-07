import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

/** Read only after hydration; blocked or invalid storage never prevents interaction. */
export function useLocalStorage<T>(key: string, initial: T, validate: (value: unknown) => value is T) {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (validate(parsed)) {
          setValue(parsed);
          setRestored(true);
        }
      }
    } catch { setAvailable(false); }
    setReady(true);
  }, [key, validate]);

  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { setAvailable(false); }
  }, [key, ready, value]);

  return { value, setValue: setValue as Dispatch<SetStateAction<T>>, ready, restored, available };
}