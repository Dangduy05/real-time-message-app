import 'webrtc-adapter';

import Peer
    from 'simple-peer';
export const createPeer =
    (
        initiator,
        stream
    ) => {

        return new Peer({

            initiator,

            trickle: false,

            stream,

            config: {
                iceServers: [
                    {
                        urls: 'stun:stun.l.google.com:19302'
                    },
                    {
                        urls: 'stun:global.stun.twilio.com:3478'
                    }
                ]
            }

        });

    };
