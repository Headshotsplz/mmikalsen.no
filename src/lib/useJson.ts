import { useEffect, useState } from 'react';

export type Loadable<T> = { status: 'loading' } | { status: 'error' } | { status: 'ready'; data: T };

// Henter JSON fra samme domene (CSP: connect-src 'self').
export function useJson<T>(url: string): Loadable<T> {
  const [state, setState] = useState<Loadable<T>>({ status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.json() as Promise<T>;
      })
      .then((data) => setState({ status: 'ready', data }))
      .catch((err: unknown) => {
        if (!controller.signal.aborted) {
          console.error(`Kunne ikke hente ${url}`, err);
          setState({ status: 'error' });
        }
      });
    return () => controller.abort();
  }, [url]);

  return state;
}
