import { useEffect, useRef } from 'react';
import { FiUser } from 'react-icons/fi';

import VideoControls from './VideoControls';


const VideoCall = ({
    stream,
    remoteStream,
    audioOnly,
    micEnabled,
    cameraEnabled,
    onToggleMic,
    onToggleCamera,
    onEnd
}) => {

    const localVideo = useRef();
    const remoteVideo = useRef();

    useEffect(() => {
        if (stream && localVideo.current) {
            localVideo.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        if (remoteStream && remoteVideo.current) {
            remoteVideo.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    return (

        <div className="video-call-shell">

            <div className="video-call-stage">

                <div className="video-call-main">
                    {remoteStream && !audioOnly ? (
                        <video
                            ref={remoteVideo}
                            autoPlay
                            playsInline
                            className="video-call__video"
                        />
                    ) : (
                        <div className="video-call-placeholder">
                            <div className="video-call-avatar"><FiUser /></div>
                            <div className="video-call-status">
                                {remoteStream ? 'Audio connected' : 'Waiting for the other person...'}
                            </div>
                        </div>
                    )}
                </div>

                <div className="video-call-self">
                    {stream && !audioOnly ? (
                        <video
                            ref={localVideo}
                            autoPlay
                            muted
                            playsInline
                            className="video-call__video"
                        />
                    ) : (
                        <div className="video-call-self-placeholder">
                            <FiUser />
                        </div>
                    )}
                </div>

            </div>

            <VideoControls
                micEnabled={micEnabled}
                cameraEnabled={cameraEnabled}
                onToggleMic={onToggleMic}
                onToggleCamera={onToggleCamera}
                onEnd={onEnd}
            />

        </div>

    );

};

export default VideoCall;

