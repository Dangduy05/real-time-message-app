import { useEffect, useMemo, useRef, useState } from 'react';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

import { connectSocket } from '../services/socket';

import useAuthStore from '../store/authStore';

import { getToken } from '../services/authService';

import IncomingCallModal from '../components/video/IncomingCallModal';

import VideoCall from '../components/video/VideoCall';

import useVideoCall from '../hooks/useVideoCall';

import socket from '../services/socket';

import useCallStore from '../store/callStore';

const CallPage = () => {

    const { friendId } = useParams(); // callerId / receiverId depends on who opens

    const [callStarted, setCallStarted] = useState(false);
    const callStartedRef = useRef(false);

    const { user, setStatus } = useAuthStore();

    const { stream, remoteStream, answerCall, callUser, endCall, toggleCamera, toggleMic, signalPeer, micEnabled, cameraEnabled } = useVideoCall();

    const { incomingCall, setIncomingCall, setCallAccepted } = useCallStore();

    const [ringing, setRinging] = useState(false);

    const audioOnly = useMemo(() => {
        // Reuse query pattern from ChatWindow: ?audioOnly=true/false
        const params = new URLSearchParams(window.location.search);
        return params.get('audioOnly') === 'true';
    }, []);

    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const token = getToken();
        if (!token) return;

        connectSocket(token);

        if (user?.status !== 'online') {
            setStatus('online');
        }

    }, [setStatus, user?.status]);

    useEffect(() => {
        const handleIncomingCall = ({ from, signalData, audioOnly: incomingAudioOnly }) => {
            const samePeer =
                String(from) === String(friendId);

            if (samePeer && (callStartedRef.current || callStarted)) {
                setRinging(false);
                setCallStarted(true);
                setCallAccepted(true);
                answerCall(from, signalData, incomingAudioOnly || false);
                return;
            }

            setIncomingCall({
                caller: from,
                signalData,
                audioOnly: incomingAudioOnly
            });
            setRinging(true);
        };

        const handleCallAccepted = (signal) => {
            setCallAccepted(true);
            signalPeer(signal);
        };

        const handleCallEnded = () => {
            setRinging(false);
            setCallStarted(false);
            // remote ended: cleanup only (no emit back)
            endCall(friendId, false);
        };

        socket.on('incomingCall', handleIncomingCall);
        socket.on('callAccepted', handleCallAccepted);
        socket.on('callEnded', handleCallEnded);

        return () => {
            socket.off('incomingCall', handleIncomingCall);
            socket.off('callAccepted', handleCallAccepted);
            socket.off('callEnded', handleCallEnded);
        };

    }, [answerCall, callStarted, endCall, friendId, setCallAccepted, setIncomingCall, signalPeer]);

    useEffect(() => {
        const incomingState = location.state?.incomingCall;

        if (!friendId || callStartedRef.current) return;

        callStartedRef.current = true;

        if (incomingState && location.state?.signalData && location.state?.from) {
            setCallStarted(true);
            answerCall(location.state.from, location.state.signalData, location.state.audioOnly || false);
            return;
        }

        setCallStarted(true);
        callUser(friendId, audioOnly);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [friendId]);

    const onAccept = () => {
        if (callStarted) return;
        if (!incomingCall?.caller || !incomingCall?.signalData) return;

        setCallStarted(true);
        setRinging(false);
        setCallAccepted(true);

        answerCall(incomingCall.caller, incomingCall.signalData, audioOnly);
    };

    const onReject = () => {
        setRinging(false);
        setCallStarted(false);
        if (incomingCall?.caller) {
            // emit endCall to callerId
            endCall(incomingCall.caller, true);
        } else {
            endCall(friendId, true);
        }
    };

    useEffect(() => {
        return () => {
            callStartedRef.current = false;
            endCall(friendId, false);
        };
    }, [endCall, friendId]);

    return (

        <div className="h-screen bg-black relative">

            {ringing && (
                <IncomingCallModal
                    caller={incomingCall?.caller || friendId}
                    onAccept={onAccept}
                    onReject={onReject}
                />
            )}

            <VideoCall
                stream={stream}
                remoteStream={remoteStream}
                audioOnly={audioOnly}
                micEnabled={micEnabled}
                cameraEnabled={cameraEnabled}
                onToggleMic={toggleMic}
                onToggleCamera={toggleCamera}
                onEnd={() => {
                    setCallStarted(false);
                    endCall(friendId, true);
                }}
            />

        </div>

    );

};

export default CallPage;

