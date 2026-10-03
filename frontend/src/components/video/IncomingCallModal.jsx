import { FiPhone, FiPhoneOff } from 'react-icons/fi';

const IncomingCallModal =
    ({
        caller,
        callerName,
        onAccept,
        onReject
    }) => {
        const displayName =
            callerName || caller || 'Unknown caller';
        const initials =
            String(displayName)
                .split(' ')
                .map((part) => part.charAt(0))
                .join('')
                .slice(0, 2)
                .toUpperCase();

        return (

            <div className="modal-backdrop">

                <div className="incoming-call-card">

                    <div className="incoming-call-avatar">
                        {initials || <FiPhone />}
                    </div>

                    <h2 className="incoming-call-name">
                        {displayName}
                    </h2>

                    <p className="incoming-call-subtitle">
                        Incoming Call...
                    </p>

                    <div className="incoming-call-actions">

                        <button
                            onClick={onAccept}
                            className="incoming-call-button incoming-call-button--accept"
                            title="Accept call"
                        >
                            <FiPhone />
                        </button>

                        <button
                            onClick={onReject}
                            className="incoming-call-button incoming-call-button--reject"
                            title="Reject call"
                        >
                            <FiPhoneOff />
                        </button>

                    </div>

                </div>

            </div>

        );

    };

export default IncomingCallModal;
