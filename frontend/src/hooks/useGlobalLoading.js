import { useSyncExternalStore } from 'react';
import { subscribeLoading, getPending } from '../api/cache';

// Number of in-flight cold fetches. > 0 means the first paint isn't ready yet.
export function useGlobalLoading() {
  return useSyncExternalStore(subscribeLoading, getPending, getPending);
}
