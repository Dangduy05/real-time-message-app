import {
    FiMic,
    FiMicOff,
    FiVideo,
    FiVideoOff,
    FiPhoneOff
} from 'react-icons/fi';

const VideoControls = ({
    micEnabled,
    cameraEnabled,
    onToggleMic,
    onToggleCamera,
    onEnd
}) => {

    return (

        <div
            className="
          flex
          justify-center
          gap-4
          p-4
        "
        >

            <button
                type="button"
                onClick={onToggleMic}
                className={
                    `
            video-controls__btn
            ${micEnabled ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}
          `
                }
                aria-label={micEnabled ? 'Mute mic' : 'Unmute mic'}
            >

                {micEnabled ? <FiMic size={18} /> : <FiMicOff size={18} />}

            </button>

            <button
                type="button"
                onClick={onToggleCamera}
                className={
                    `
            video-controls__btn
            ${cameraEnabled ? 'bg-sky-600 hover:bg-sky-500 text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'}
          `
                }
                aria-label={cameraEnabled ? 'Turn off camera' : 'Turn on camera'}
            >

                {cameraEnabled ? <FiVideo size={18} /> : <FiVideoOff size={18} />}

            </button>

            <button
                type="button"
                onClick={onEnd}
                className="
            video-controls__btn
            video-controls__btn--danger
            bg-red-600 hover:bg-red-500 text-white
          "
                aria-label="End call"
            >

                <FiPhoneOff size={18} />

            </button>

        </div>

    );

};

export default VideoControls;

