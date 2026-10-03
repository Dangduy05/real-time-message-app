const nextTick =
    (callback, ...args) => {

        if (typeof queueMicrotask === 'function') {
            queueMicrotask(() => callback(...args));
            return;
        }

        Promise.resolve()
            .then(() => callback(...args));

    };

const processPolyfill = {
    browser: true,
    env: {
        NODE_ENV: import.meta.env.MODE || 'development',
        DEBUG: ''
    },
    nextTick,
    stdout: {},
    stderr: {},
    emitWarning: () => {}
};

if (!globalThis.process) {
    globalThis.process = processPolyfill;
} else {
    globalThis.process.browser = true;
    globalThis.process.env = {
        ...processPolyfill.env,
        ...(globalThis.process.env || {})
    };
    globalThis.process.nextTick = globalThis.process.nextTick || nextTick;
    globalThis.process.stdout = globalThis.process.stdout || {};
    globalThis.process.stderr = globalThis.process.stderr || {};
    globalThis.process.emitWarning = globalThis.process.emitWarning || (() => {});
}
