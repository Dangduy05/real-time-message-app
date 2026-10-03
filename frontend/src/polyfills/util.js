export const debuglog =
    () => () => {};

export const inspect =
    (value) => {

        if (typeof value === 'string') {
            return value;
        }

        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }

    };

export const deprecate =
    (fn) => fn;

export const inherits =
    (ctor, superCtor) => {

        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
            constructor: {
                value: ctor,
                enumerable: false,
                writable: true,
                configurable: true
            }
        });

    };

export default {
    debuglog,
    inspect,
    deprecate,
    inherits
};
