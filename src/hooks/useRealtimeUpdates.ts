import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { updatesSocket } from '@/lib/socket';

/**
 * Connects to the updates WebSocket and invalidates the given query keys
 * whenever the server broadcasts any update event.
 *
 * @param queryKeys - Array of React Query cache keys to invalidate on update.
 */
export function useRealtimeUpdates(queryKeys: readonly unknown[][]) {
  const queryClient = useQueryClient();
  // Stable ref to avoid re-running the effect when queryKeys identity changes
  const queryKeysRef = useRef(queryKeys);
  useEffect(() => { queryKeysRef.current = queryKeys; });

  useEffect(() => {
    updatesSocket.connect();

    const unsub = updatesSocket.subscribe('all', () => {
      queryKeysRef.current.forEach(qk =>
        queryClient.invalidateQueries({ queryKey: qk })
      );
    });

    return unsub;
  }, [queryClient]);
}
