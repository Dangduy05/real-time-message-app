const THEME_KEY = 'theme';

export const getTheme =
    () => localStorage.getItem(THEME_KEY) || 'dark';

export const applyTheme =
    (theme) => {

        const nextTheme =
            theme === 'light'
                ? 'light'
                : 'dark';

        document.documentElement.dataset.theme = nextTheme;
        localStorage.setItem(THEME_KEY, nextTheme);
        return nextTheme;

    };
