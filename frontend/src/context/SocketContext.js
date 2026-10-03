import {
    createContext
} from 'react';

import socket
    from '../services/socket';

export const SocketContext =
    createContext();

export const SocketProvider =
    ({ children }) => {

        return (

            <SocketContext.Provider
                value={socket}
            >

                {children}

            </SocketContext.Provider>

        );

    };