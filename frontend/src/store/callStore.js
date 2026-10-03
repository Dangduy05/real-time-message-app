import { create }
    from 'zustand';

const useCallStore =
    create((set) => ({

        incomingCall: null,

        callAccepted: false,

        setIncomingCall:
            (call) => {

                set({
                    incomingCall: call
                });

            },

        setCallAccepted:
            (value) => {

                set({
                    callAccepted: value
                });

            }

    }));

export default useCallStore;