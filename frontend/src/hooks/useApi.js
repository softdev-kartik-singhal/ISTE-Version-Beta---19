// Calls an async api.js function and tracks its state: loading, ready, error, or one of the two "no data yet" states
// the fetcher can return ({ __state: 'empty' } or { __state: 'insufficient', messages }).
// It refetches whenever api.js reports a change (upload, correction, goal edit...) so every page stays consistent.
import { useEffect, useState } from 'react';
import { subscribe } from '../services/api';

export function useApi(fetcher, deps = []) {
  const [state, setState] = useState({ status: 'loading' });
  const [retries, setRetries] = useState(0);
  const [changes, setChanges] = useState(0);

  useEffect(() => subscribe(() => setChanges((n) => n + 1)), []);

  useEffect(() => {
    let active = true;
    setState((s) => (s.status === 'ready' ? s : { status: 'loading' })); // keep showing old data while refreshing
    fetcher()
      .then((result) => active && setState(result?.__state ? { status: result.__state, ...result } : { status: 'ready', data: result }))
      .catch((error) => active && setState({ status: 'error', error }));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, retries, changes]);

  return { ...state, ready: state.status === 'ready', retry: () => setRetries((n) => n + 1) };
}
