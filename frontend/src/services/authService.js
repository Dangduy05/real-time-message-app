export const saveToken =
    (token) => {

        localStorage.setItem(
            'token',
            token
        );

    };

export const saveUser =
    (user) => {

        localStorage.setItem(
            'user',
            JSON.stringify(user)
        );

    };

export const getToken =
    () => {

        return localStorage.getItem(
            'token'
        );

    };

export const getUser =
    () => {

        const user =
            localStorage.getItem('user');

        try {

            return user
                ? JSON.parse(user)
                : null;

        } catch {

            localStorage.removeItem('user');
            return null;

        }

    };

export const logout =
    () => {

        localStorage.removeItem(
            'token'
        );

        localStorage.removeItem(
            'user'
        );

    };

let unauthorizedHandled = false;

export const handleUnauthorized =
    () => {

        if (unauthorizedHandled) {
            return;
        }

        unauthorizedHandled = true;
        logout();

        if (window.location.pathname !== '/') {
            window.location.replace('/');
        }

    };
