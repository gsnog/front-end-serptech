import { useEffect } from 'react';
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

  useEffect(() => {
    updatesSocket.connect();

    const unsub = updatesSocket.subscribe('all', () => {
      queryKeys.forEach(qk =>
        queryClient.invalidateQueries({ queryKey: qk })
      );
    });

    return unsub;
    // queryKeys intentionally omitted — stable references expected from callers
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);
}
