const API =
    import.meta.env.VITE_API_URL || '';

export const resolveFileUrl =
    (url) => {

        if (!url) {
            return '';
        }

        if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) {
            return url;
        }

        return `${API}${url.startsWith('/') ? url : `/${url}`}`;

    };
