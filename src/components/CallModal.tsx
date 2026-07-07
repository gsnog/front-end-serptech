/**
 * CallModal.tsx
 * ─────────────────────────────────────────────────────────────────────────
 * Floating video call interface.
 *
 * Renders:
 *  - Full-screen overlay when a call is active (connected / calling)
 *  - Incoming call banner (bottom-right toast-style) when receiving a call
 *  - Local video (picture-in-picture, bottom-right of the main video)
 *  - Remote video (full screen)
 *  - Control bar: Mute, Camera, End Call
 *
 * Usage (mount once at App level or inside a context provider):
 *   <CallModal
 *     webrtc={useWebRTC(currentUserId)}
 *     onInitiateCall={startCall}
 *   />
 */

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Mic, MicOff, Video, VideoOff, Phone, PhoneOff,
    PhoneCall, PhoneIncoming, User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { UseWebRTCReturn } from '@/hooks/useWebRTC';

interface CallModalProps {
    webrtc: UseWebRTCReturn;
}

// ─── Video element that auto-attaches a MediaStream ────────────────────────

function VideoElement({
    stream,
    muted = false,
    className = '',
    label,
}: {
    stream: MediaStream | null;
    muted?: boolean;
    className?: string;
    label?: string;
}) {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const el = videoRef.current;
        if (!el) return;
        if (stream) {
            el.srcObject = stream;
            el.play().catch(() => { }); // autoplay policy guard
        } else {
            el.srcObject = null;
        }
    }, [stream]);

    return (
        <div className={`relative ${className}`}>
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={muted}
                className="w-full h-full object-cover rounded-xl"
            />
            {!stream && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-900 rounded-xl">
                    <User className="h-12 w-12 text-gray-600" />
                </div>
            )}
            {label && (
                <span className="absolute bottom-2 left-2 text-xs text-white bg-black/50 rounded px-1.5 py-0.5">
                    {label}
                </span>
            )}
        </div>
    );
}

// ─── Control Button ────────────────────────────────────────────────────────

function ControlBtn({
    onClick,
    active = false,
    danger = false,
    icon: Icon,
    label,
}: {
    onClick: () => void;
    active?: boolean;
    danger?: boolean;
    icon: React.ElementType;
    label: string;
}) {
    return (
        <button
            onClick={onClick}
            title={label}
            aria-label={label}
            className={`
        flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all
        ${danger
                    ? 'bg-rose-600 hover:bg-rose-700 text-white'
                    : active
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-white/10 text-white hover:bg-white/20'
                }
      `}
        >
            <Icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{label}</span>
        </button>
    );
}

// ─── Main Component ────────────────────────────────────────────────────────

export function CallModal({ webrtc }: CallModalProps) {
    const {
        callStatus,
        localStream,
        remoteStream,
        incomingCall,
        callType,
        isMuted,
        isCameraOff,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
        currentCallName,
    } = webrtc;

    const isActive = callStatus === 'connected' || callStatus === 'calling';

    return (
        <>
            {/* ── Active / Calling overlay ──────────────────────────────────── */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        key="call-overlay"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-[9999] bg-gray-950 flex flex-col"
                    >
                        {/* Remote video (full screen) */}
                        <div className="relative flex-1 overflow-hidden">
                            {callStatus === 'connected' ? (
                                <>
                                    <VideoElement
                                        stream={remoteStream}
                                        className={callType === 'audio' ? "hidden" : "absolute inset-0"}
                                        label={currentCallName}
                                    />
                                    {callType === 'audio' && (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900 w-full h-full">
                                            <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center">
                                                <User className="h-16 w-16 text-primary" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-white text-3xl font-semibold">{currentCallName}</p>
                                                <p className="text-gray-400 text-sm mt-2">Chamada de voz em andamento</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Calling / ringing screen */
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gray-900">
                                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                                        <PhoneCall className="h-10 w-10 text-primary" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-white text-2xl font-semibold">{currentCallName}</p>
                                        <p className="text-gray-400 text-sm mt-1">Chamando…</p>
                                    </div>
                                </div>
                            )}

                            {/* Local video (PiP — bottom right) */}
                            {callType === 'video' && (
                                <div className="absolute bottom-4 right-4 w-36 h-24 md:w-48 md:h-32 shadow-2xl ring-2 ring-white/20 rounded-xl overflow-hidden">
                                    <VideoElement
                                        stream={localStream}
                                        muted
                                        className="w-full h-full"
                                        label="Você"
                                    />
                                </div>
                            )}
                        </div>

                        {/* Control bar */}
                        <div className="flex items-center justify-center gap-4 p-5 bg-gray-900/80 backdrop-blur">
                            <ControlBtn
                                onClick={toggleMute}
                                active={isMuted}
                                icon={isMuted ? MicOff : Mic}
                                label={isMuted ? 'Desmutar' : 'Mutar'}
                            />
                            <ControlBtn
                                onClick={toggleCamera}
                                active={isCameraOff}
                                icon={isCameraOff ? VideoOff : Video}
                                label={isCameraOff ? 'Ligar câmera' : 'Desligar câmera'}
                            />
                            <ControlBtn
                                onClick={endCall}
                                danger
                                icon={PhoneOff}
                                label="Encerrar"
                            />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Incoming call banner (toast-style) ───────────────────────── */}
            <AnimatePresence>
                {callStatus === 'incoming' && incomingCall && (
                    <motion.div
                        key="incoming-call"
                        initial={{ opacity: 0, y: 80, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 80, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="fixed bottom-6 right-6 z-[9998] flex flex-col gap-3
              bg-gray-900 border border-gray-700 shadow-2xl rounded-2xl p-5 w-72"
                    >
                        {/* Pulsing ring animation */}
                        <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                                <span className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
                                <div className="relative w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
                                    <PhoneIncoming className="h-5 w-5 text-white" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold truncate">{incomingCall.callerName}</p>
                                <p className="text-gray-400 text-xs">
                                    {incomingCall.callType === 'audio' ? 'Chamada de voz recebida' : 'Chamada de vídeo recebida'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={rejectCall}
                                variant="outline"
                                className="flex-1 border-rose-500/50 text-rose-400 hover:bg-rose-500/10 gap-1.5"
                                size="sm"
                            >
                                <PhoneOff className="h-4 w-4" />
                                Recusar
                            </Button>
                            <Button
                                onClick={() => acceptCall(incomingCall.callType || 'video')}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                                size="sm"
                            >
                                <Phone className="h-4 w-4" />
                                Atender
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
