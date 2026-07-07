/**
 * useWebRTC.ts
 * ─────────────────────────────────────────────────────────────────────────
 * Custom hook that manages the full WebRTC P2P call lifecycle.
 *
 * Architecture:
 *   - Uses the existing rtcSocket singleton (lib/socket/index.ts) for signaling
 *   - Manages RTCPeerConnection internally
 *   - Exposes a clean, React-friendly API for CallModal
 *
 * Flow (outgoing call initiated by local user):
 *   1. startCall(targetUserId, targetName)
 *   2. Hook captures getUserMedia → local stream
 *   3. Creates RTCPeerConnection, adds tracks
 *   4. Creates SDP offer → sends call_offer to signaling server
 *   5. On call_answer → setRemoteDescription
 *   6. ICE candidates exchanged in both directions
 *   7. Remote stream arrives via ontrack event
 *
 * Flow (incoming call received):
 *   1. Signaling server delivers call_offer to this client
 *   2. Hook sets incomingCall state → CallModal shows "Incoming Call" banner
 *   3. acceptCall() → captures media → creates answer → sends call_answer
 *   4. rejectCall() → sends call_reject → clears state
 *
 * Memory leak prevention:
 *   - All event listeners added via rtcSocket.subscribe() return an unsubscribe fn
 *   - Media tracks and RTCPeerConnection are closed in cleanup()
 *   - useEffect cleanup runs on unmount
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { rtcSocket } from '@/lib/socket';
import { toast } from '@/hooks/use-toast';

// ─── ICE servers (STUN only — works for same-network testing, add TURN for prod) ──
const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
    ],
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type CallStatus =
    | 'idle'         // No call
    | 'calling'      // Outgoing call ringing (waiting for answer)
    | 'incoming'     // Receiving an incoming call
    | 'connected'    // Call is active
    | 'ended';       // Call just ended (transitional)

export interface IncomingCallInfo {
    callerId: number;
    callerName: string;
    sdp: RTCSessionDescriptionInit;
    callType: 'audio' | 'video';
}

export interface UseWebRTCReturn {
    callStatus: CallStatus;
    localStream: MediaStream | null;
    remoteStream: MediaStream | null;
    incomingCall: IncomingCallInfo | null;
    callType: 'audio' | 'video';
    isMuted: boolean;
    isCameraOff: boolean;
    startCall: (targetUserId: number, targetName: string, type?: 'audio' | 'video') => Promise<void>;
    acceptCall: (type?: 'audio' | 'video') => Promise<void>;
    rejectCall: () => void;
    endCall: () => void;
    toggleMute: () => void;
    toggleCamera: () => void;
    currentCallName: string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWebRTC(currentUserId: number): UseWebRTCReturn {
    const [callStatus, setCallStatus] = useState<CallStatus>('idle');
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [incomingCall, setIncomingCall] = useState<IncomingCallInfo | null>(null);
    const [callType, setCallType] = useState<'audio' | 'video'>('video');
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [currentCallName, setCurrentCallName] = useState('');

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const targetIdRef = useRef<number | null>(null);
    const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
    const ringtoneRef = useRef<HTMLAudioElement | null>(null);

    // Initialize ringtone
    useEffect(() => {
        const audio = new Audio('/ringtone.mp3'); // Fallback to missing asset if unavailable, will just trigger silent error
        audio.loop = true;
        ringtoneRef.current = audio;
        return () => { audio.pause(); audio.src = ''; };
    }, []);

    // Manage ringtone play/pause based on call status
    useEffect(() => {
        if (!ringtoneRef.current) return;
        if (callStatus === 'incoming' || callStatus === 'calling') {
            ringtoneRef.current.play().catch(() => { });
        } else {
            ringtoneRef.current.pause();
            ringtoneRef.current.currentTime = 0;
        }
    }, [callStatus]);

    // ── Signal sender helpers ──────────────────────────────────────────────

    const sendSignal = useCallback((type: string, extra: Record<string, unknown> = {}) => {
        if (targetIdRef.current === null) return;
        rtcSocket.send({
            type,
            target_id: targetIdRef.current,
            ...extra,
        });
    }, []);

    // ── Media capture ──────────────────────────────────────────────────────

    const getMedia = useCallback(async (type: 'audio' | 'video' = 'video'): Promise<MediaStream> => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: type === 'video',
                audio: true,
            });
            localStreamRef.current = stream;
            setLocalStream(stream);
            return stream;
        } catch (err: any) {
            const isDenied =
                err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
            toast({
                title: isDenied ? 'Permissão negada' : 'Erro de câmera/microfone',
                description: isDenied
                    ? 'Permita o acesso à câmera e microfone no navegador para fazer chamadas.'
                    : 'Não foi possível acessar câmera/microfone. Verifique os dispositivos.',
                variant: 'destructive',
            });
            throw err;
        }
    }, []);

    // ── RTCPeerConnection setup ────────────────────────────────────────────

    const createPeerConnection = useCallback((stream: MediaStream): RTCPeerConnection => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        // Add local tracks
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        // Remote stream assembly
        const remote = new MediaStream();
        setRemoteStream(remote);
        pc.ontrack = (event) => {
            event.streams[0]?.getTracks().forEach((track) => remote.addTrack(track));
        };

        // ICE candidate forwarding
        pc.onicecandidate = (event) => {
            if (event.candidate) {
                sendSignal('ice_candidate', { candidate: event.candidate.toJSON() });
            }
        };

        // Connection state logging / cleanup on failure
        pc.onconnectionstatechange = () => {
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                setCallStatus('ended');
                setTimeout(() => cleanup(), 2000);
            }
            if (pc.connectionState === 'connected') {
                setCallStatus('connected');
            }
        };

        pcRef.current = pc;
        return pc;
    }, [sendSignal]);

    // ── Cleanup ────────────────────────────────────────────────────────────

    const cleanup = useCallback(() => {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
        pcRef.current?.close();
        pcRef.current = null;
        localStreamRef.current = null;
        targetIdRef.current = null;
        pendingCandidatesRef.current = [];
        setLocalStream(null);
        setRemoteStream(null);
        setCallStatus('idle');
        setIncomingCall(null);
        setIsMuted(false);
        setIsCameraOff(false);
        setCurrentCallName('');
    }, []);

    // ── Incoming signal handlers ───────────────────────────────────────────

    useEffect(() => {
        const unsubOffer = rtcSocket.subscribe('call_offer', async (data) => {
            // Ignore if already in a call
            if (callStatus !== 'idle') {
                rtcSocket.send({
                    type: 'call_reject',
                    target_id: data.caller_id,
                    reason: 'busy',
                });
                return;
            }

            setCallType(data.callType || 'video');
            setIncomingCall({
                callerId: data.caller_id,
                callerName: data.caller_name,
                sdp: data.sdp,
                callType: data.callType || 'video',
            });
            targetIdRef.current = data.caller_id;
            setCurrentCallName(data.caller_name);
            setCallStatus('incoming');
        });

        const unsubAnswer = rtcSocket.subscribe('call_answer', async (data) => {
            if (!pcRef.current) return;
            await pcRef.current.setRemoteDescription(new RTCSessionDescription(data.sdp));

            // Drain buffered ICE candidates
            for (const c of pendingCandidatesRef.current) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidatesRef.current = [];
        });

        const unsubReject = rtcSocket.subscribe('call_reject', () => {
            toast({ title: 'Chamada recusada', description: `${currentCallName} recusou a chamada.` });
            cleanup();
        });

        const unsubEnd = rtcSocket.subscribe('call_end', (data) => {
            const reason = data.reason === 'peer_disconnected' ? 'A conexão foi encerrada pelo outro lado.' : undefined;
            if (reason) {
                toast({ title: 'Chamada encerrada', description: reason });
            }
            cleanup();
        });

        const unsubIce = rtcSocket.subscribe('ice_candidate', async (data) => {
            if (!data.candidate) return;
            if (pcRef.current && pcRef.current.remoteDescription) {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
            } else {
                pendingCandidatesRef.current.push(data.candidate);
            }
        });

        return () => {
            unsubOffer();
            unsubAnswer();
            unsubReject();
            unsubEnd();
            unsubIce();
        };
    }, [callStatus, currentCallName, cleanup]);

    // ── Public actions ─────────────────────────────────────────────────────

    const startCall = useCallback(async (targetUserId: number, targetName: string, type: 'audio' | 'video' = 'video') => {
        try {
            targetIdRef.current = targetUserId;
            setCurrentCallName(targetName);
            setCallStatus('calling');
            setCallType(type);

            const stream = await getMedia(type);
            const pc = createPeerConnection(stream);

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            sendSignal('call_offer', { sdp: offer, callType: type });
        } catch {
            cleanup();
        }
    }, [getMedia, createPeerConnection, sendSignal, cleanup]);

    const acceptCall = useCallback(async (type: 'audio' | 'video' = 'video') => {
        if (!incomingCall) return;
        try {
            setCallType(type);
            const stream = await getMedia(type);
            const pc = createPeerConnection(stream);

            await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.sdp));

            // Drain buffered ICE candidates
            for (const c of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(c));
            }
            pendingCandidatesRef.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            sendSignal('call_answer', { sdp: answer });
            setCallStatus('connected');
            setIncomingCall(null);
        } catch {
            cleanup();
        }
    }, [incomingCall, getMedia, createPeerConnection, sendSignal, cleanup]);

    const rejectCall = useCallback(() => {
        sendSignal('call_reject');
        cleanup();
    }, [sendSignal, cleanup]);

    const endCall = useCallback(() => {
        sendSignal('call_end');
        cleanup();
    }, [sendSignal, cleanup]);

    const toggleMute = useCallback(() => {
        localStreamRef.current?.getAudioTracks().forEach((t) => {
            t.enabled = !t.enabled;
        });
        setIsMuted((prev) => !prev);
    }, []);

    const toggleCamera = useCallback(() => {
        localStreamRef.current?.getVideoTracks().forEach((t) => {
            t.enabled = !t.enabled;
        });
        setIsCameraOff((prev) => !prev);
    }, []);

    // rtcSocket is connected by WebRTCContext/PermissionsContext — just subscribe here
    useEffect(() => {
        return cleanup;
    }, [cleanup]);

    return {
        callStatus,
        localStream,
        remoteStream,
        incomingCall,
        callType,
        isMuted,
        isCameraOff,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        currentCallName,
    };
}
