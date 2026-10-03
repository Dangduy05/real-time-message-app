const createAudio =
    (src, options = {}) => {

        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.loop = Boolean(options.loop);
        audio.volume = options.volume ?? 0.75;
        return audio;

    };

const sounds = {
    incoming: createAudio('/assets/incoming.mp3', {
        loop: true,
        volume: 0.7
    }),
    disconnect: createAudio('/assets/disconnect.mp3', {
        volume: 0.65
    }),
    ping: createAudio('/assets/ping.mp3', {
        volume: 0.7
    })
};

export const playSound =
    async (name) => {

        const sound = sounds[name];

        if (!sound) {
            return;
        }

        try {
            sound.currentTime = 0;
            await sound.play();
        } catch {
            // Browsers may block autoplay until the user interacts with the page.
        }

    };

export const stopSound =
    (name) => {

        const sound = sounds[name];

        if (!sound) {
            return;
        }

        sound.pause();
        sound.currentTime = 0;

    };
