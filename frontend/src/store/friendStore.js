import { create }
    from 'zustand';

const useFriendStore =
    create((set) => ({

        friends: [],

        setFriends:
            (friends) => {

                set({ friends });

            }

    }));

export default useFriendStore;