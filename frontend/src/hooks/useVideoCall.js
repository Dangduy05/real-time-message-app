import { useRef, useState, useCallback } from 'react';

import socket from '../services/socket';

import { createPeer } from '../services/webrtc';

const useVideoCall = () => {

    const [stream, setStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);

    const [micEnabled, setMicEnabled] = useState(true);
    const [cameraEnabled, setCameraEnabled] = useState(true);

    const peerRef = useRef(null);

    const attachLocalStream = useCallback(async ({ audioOnly }) => {
        const currentStream = await navigator.mediaDevices.getUserMedia({
            video: !audioOnly,
            audio: true
        });

        // Ensure initial enabled states reflect the actual tracks
        currentStream.getAudioTracks().forEach((t) => {
            t.enabled = true;
        });
        currentStream.getVideoTracks().forEach((t) => {
            t.enabled = !audioOnly;
        });

        setStream(currentStream);
        return currentStream;
    }, []);

    const createAndBindPeer = useCallback((initiator, currentStream) => {
        const peer = createPeer(initiator, currentStream);

        peer.on('stream', (remote) => {
            setRemoteStream(remote);
        });

        peerRef.current = peer;
        return peer;
    }, []);

    const cleanupCurrentPeer = useCallback(() => {
        if (peerRef.current) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
    }, []);

    const callUser = useCallback(async (userId, audioOnly = false) => {
        try {
            cleanupCurrentPeer();
            const currentStream = await attachLocalStream({ audioOnly });

            const peer = createAndBindPeer(true, currentStream);

            peer.on('signal', (signalData) => {
                socket.emit('callUser', {
                    to: userId,
                    signalData,
                    audioOnly
                });
            });

        } catch (err) {
            console.error('Unable to start call', err);
        }
    }, [attachLocalStream, cleanupCurrentPeer, createAndBindPeer]);

    const answerCall = useCallback(async (callerId, signalData, audioOnly = false) => {
        try {
            cleanupCurrentPeer();
            const currentStream = await attachLocalStream({ audioOnly });

            // Non-initiator
            const peer = createAndBindPeer(false, currentStream);

            peer.on('signal', (signal) => {
                socket.emit('answerCall', {
                    to: callerId,
                    signal
                });
            });

            // Feed the offer/answer data from caller
            peer.signal(signalData);

        } catch (err) {
            console.error('Unable to answer call', err);
        }
    }, [attachLocalStream, cleanupCurrentPeer, createAndBindPeer]);

    const signalPeer = useCallback((signal) => {
        try {
            if (peerRef.current) {
                peerRef.current.signal(signal);
            }
        } catch (err) {
            console.error('Unable to signal peer', err);
        }
    }, []);

    const toggleMic = useCallback(() => {
        setMicEnabled((prev) => {
            const next = !prev;
            if (stream) {
                stream.getAudioTracks().forEach((t) => (t.enabled = next));
            }
            return next;
        });
    }, [stream]);

    const toggleCamera = useCallback(() => {
        setCameraEnabled((prev) => {
            const next = !prev;
            if (stream) {
                stream.getVideoTracks().forEach((t) => (t.enabled = next));
            }
            return next;
        });
    }, [stream]);

    const cleanupCall = useCallback(() => {
        try {
            const currentStream = peerRef.current?._localStreams?.[0] || stream;

            if (peerRef.current) {
                peerRef.current.destroy();
                peerRef.current = null;
            }

            if (currentStream) {
                currentStream.getTracks().forEach((t) => t.stop());
            }

            setStream(null);
            setRemoteStream(null);
            setMicEnabled(true);
            setCameraEnabled(true);
        } catch (e) {
            console.error('cleanupCall error', e);
        }
    }, [stream]);

    const endCall = useCallback((toId, emit = true) => {
        try {
            if (toId && emit) {
                socket.emit('endCall', { to: toId });
            }

            cleanupCall();
        } catch (e) {
            console.error('endCall error', e);
        }
    }, [cleanupCall]);


    return {
        stream,

        remoteStream,

        micEnabled,
        cameraEnabled,

        callUser,
        answerCall,
        signalPeer,

        toggleMic,
        toggleCamera,
        endCall,
        cleanupCall
    };

};

export default useVideoCall;

