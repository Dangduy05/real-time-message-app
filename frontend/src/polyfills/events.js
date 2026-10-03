function EventEmitter() {
    if (!(this instanceof EventEmitter)) {
        return new EventEmitter();
    }

    this._events = Object.create(null);
}

EventEmitter.prototype.on = function on(event, listener) {
    if (!this._events[event]) {
        this._events[event] = [];
    }

    this._events[event].push(listener);
    return this;
};

EventEmitter.prototype.addListener = EventEmitter.prototype.on;

EventEmitter.prototype.once = function once(event, listener) {
    const wrapped = (...args) => {
        this.removeListener(event, wrapped);
        listener(...args);
    };

    wrapped.listener = listener;
    return this.on(event, wrapped);
};

EventEmitter.prototype.emit = function emit(event, ...args) {
    const listeners = this._events[event];

    if (!listeners) {
        return false;
    }

    listeners.slice().forEach((listener) => {
        listener(...args);
    });

    return true;
};

EventEmitter.prototype.listeners = function listeners(event) {
    return this._events[event]
        ? this._events[event].slice()
        : [];
};

EventEmitter.prototype.removeListener = function removeListener(event, listener) {
    const listeners = this._events[event];

    if (!listeners) {
        return this;
    }

    this._events[event] = listeners.filter((item) => (
        item !== listener && item.listener !== listener
    ));

    if (this._events[event].length === 0) {
        delete this._events[event];
    }

    return this;
};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
    if (event) {
        delete this._events[event];
    } else {
        this._events = Object.create(null);
    }

    return this;
};

EventEmitter.listenerCount = (emitter, event) => emitter.listeners(event).length;

export { EventEmitter };

export default EventEmitter;
