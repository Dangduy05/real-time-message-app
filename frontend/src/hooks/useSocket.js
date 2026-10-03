import { useEffect }
    from 'react';

import socket
    from '../services/socket';

const useSocket =
    (
        event,
        callback
    ) => {

        useEffect(() => {

            socket.on(
                event,
                callback
            );

            return () => {

                socket.off(
                    event,
                    callback
                );

            };

        }, [event]);

    };

export default useSocket;