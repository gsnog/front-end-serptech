/**
 * WebRTCContext.tsx
 * ──────────────────────────────────────────────────────────────────────────
 * React Context that wraps the useWebRTC hook so the CallModal and call
 * initiation buttons (in Chat, Contacts, etc.) can share the same state.
 *
 * Usage:
 *   1. Wrap your App with <WebRTCProvider>
 *   2. Use useWebRTCContext() in any component to get the webrtc object
 *   3. Mount <CallModal webrtc={webrtc} /> once at the root level
 *
 * The rtcSocket JWT connection is initialised here once we have the user's
 * access token from localStorage.
 */

import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    type ReactNode,
} from 'react';
import { useWebRTC, type UseWebRTCReturn } from '@/hooks/useWebRTC';
import { rtcSocket } from '@/lib/socket';
import { CallModal } from '@/components/CallModal';

interface WebRTCContextValue extends UseWebRTCReturn {
    /** Initiate a call to a specific user */
    startCallTo: (targetUserId: number, targetName: string, type?: 'audio' | 'video') => Promise<void>;
}

const WebRTCContext = createContext<WebRTCContextValue | null>(null);

export function useWebRTCContext(): WebRTCContextValue {
    const ctx = useContext(WebRTCContext);
    if (!ctx) {
        throw new Error('useWebRTCContext must be used inside <WebRTCProvider>');
    }
    return ctx;
}

export function WebRTCProvider({ children }: { children: ReactNode }) {
    // Read user from localStorage (same shape as PermissionsContext)
    const currentUserId: number = useMemo(() => {
        try {
            const raw = localStorage.getItem('userPermissions');
            if (raw) {
                const parsed = JSON.parse(raw);
                return parsed.id ?? 0;
            }
        } catch {/* ignore */ }
        return 0;
    }, []);

    const webrtc = useWebRTC(currentUserId);

    // ── Connect rtcSocket with the JWT token from localStorage ────────────
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token || currentUserId === 0) return;

        const apiUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
        const wsBase = apiUrl.replace(/^http/, 'ws');
        const wsUrl = `${wsBase}/ws/signaling/?token=${token}`;

        Object.defineProperty(rtcSocket, 'url', { value: wsUrl, writable: true, configurable: true });

        rtcSocket.connect();

        return () => {
            // Don't disconnect on unmount (provider should live for the app lifetime)
        };
    }, [currentUserId]);

    const value = useMemo<WebRTCContextValue>(() => ({
        ...webrtc,
        startCallTo: webrtc.startCall,
    }), [webrtc]);

    return (
        <WebRTCContext.Provider value={value}>
            {children}
            {/* Mount CallModal once — it's always listening for incoming calls */}
            <CallModal webrtc={webrtc} />
        </WebRTCContext.Provider>
    );
}
