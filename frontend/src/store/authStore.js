import { create }
    from 'zustand';

import {
    getToken,
    getUser,
    logout as clearStoredAuth,
    saveToken,
    saveUser
} from '../services/authService';

const useAuthStore =
    create((set) => ({

        user: getUser(),

        token: getToken(),

        setAuth:
            (user, token) => {

                saveUser(user);
                saveToken(token);

                set({
                    user,
                    token
                });

            },

        setStatus:
            (status) => {

                set((state) => ({
                    user: {
                        ...state.user,
                        status
                    }
                }));

            },

        updateUser:
            (updates) => {

                set((state) => {
                    const user = {
                        ...state.user,
                        ...updates
                    };

                    saveUser(user);

                    return {
                        user
                    };
                });

            },

        logout:
            () => {

                clearStoredAuth();

                set({
                    user: null,
                    token: null
                });

            }

    }));

export default useAuthStore;
