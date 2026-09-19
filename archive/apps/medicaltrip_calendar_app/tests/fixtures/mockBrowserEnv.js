/**
 * Mock Browser Environment for Headless Node.js Testing
 * Provides clean, isolated mocks for DOM, LocalStorage, Navigator Storage, Canvas, and Web Workers.
 */

class MockLocalStorage {
    constructor() {
        this.store = new Map();
    }
    getItem(key) {
        return this.store.has(key) ? this.store.get(key) : null;
    }
    setItem(key, value) {
        this.store.set(String(key), String(value));
    }
    removeItem(key) {
        this.store.delete(key);
    }
    clear() {
        this.store.clear();
    }
    get length() {
        return this.store.size;
    }
    key(index) {
        return Array.from(this.store.keys())[index] || null;
    }
}

class MockElement {
    constructor(tagName = 'div') {
        this.tagName = tagName.toUpperCase();
        this.innerHTML = '';
        this.dataset = {};
        this.style = {};
        this.classList = {
            classes: new Set(),
            add: (...cls) => cls.forEach(c => this.classList.classes.add(c)),
            remove: (...cls) => cls.forEach(c => this.classList.classes.delete(c)),
            contains: (c) => this.classList.classes.has(c),
            toggle: (c) => {
                if (this.classList.classes.has(c)) {
                    this.classList.classes.delete(c);
                    return false;
                }
                this.classList.classes.add(c);
                return true;
            }
        };
        this.attributes = new Map();
        this.listeners = new Map();
        this.value = '';
        this.width = 400;
        this.height = 120;
    }

    setAttribute(name, value) {
        this.attributes.set(name, String(value));
        if (name === 'value') this.value = String(value);
        if (name.startsWith('data-')) {
            const key = name.replace(/^data-/, '').replace(/-([a-z])/g, (_, l) => l.toUpperCase());
            this.dataset[key] = String(value);
        }
    }

    getAttribute(name) {
        return this.attributes.get(name) || null;
    }

    removeAttribute(name) {
        this.attributes.delete(name);
    }

    addEventListener(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    removeEventListener(event, callback) {
        if (this.listeners.has(event)) {
            const list = this.listeners.get(event).filter(cb => cb !== callback);
            this.listeners.set(event, list);
        }
    }

    dispatchEvent(event) {
        const type = event.type || event;
        const cbs = this.listeners.get(type) || [];
        cbs.forEach(cb => cb(event));
        return true;
    }

    getContext(type) {
        if (type === '2d') {
            return {
                lineWidth: 1,
                lineCap: 'round',
                strokeStyle: '#000',
                beginPath: () => {},
                moveTo: (x, y) => {},
                lineTo: (x, y) => {},
                bezierCurveTo: (cp1x, cp1y, cp2x, cp2y, x, y) => {},
                stroke: () => {},
                clearRect: (x, y, w, h) => {},
                fillRect: (x, y, w, h) => {},
                getImageData: () => ({ data: new Uint8ClampedArray(4) }),
                putImageData: () => {}
            };
        }
        return null;
    }

    remove() {
        // Mock remove
    }
}

class MockDocument {
    constructor() {
        this.elements = new Map();
        this.body = new MockElement('body');
        this.head = new MockElement('head');
    }

    createElement(tagName) {
        return new MockElement(tagName);
    }

    getElementById(id) {
        if (!this.elements.has(id)) {
            const el = new MockElement('div');
            el.id = id;
            this.elements.set(id, el);
        }
        return this.elements.get(id);
    }

    querySelectorAll(selector) {
        return [];
    }

    querySelector(selector) {
        return null;
    }

    addEventListener(event, callback) {}
}

export function setupMockBrowserEnv() {
    const originalNavigator = globalThis.navigator;
    const originalLocalStorage = globalThis.localStorage;
    const originalDocument = globalThis.document;
    const originalWindow = globalThis.window;

    const mockStorage = new MockLocalStorage();
    const mockDoc = new MockDocument();
    const mockNav = {
        storage: {
            persist: async () => true,
            persisted: async () => true,
            estimate: async () => ({ quota: 1073741824, usage: 2048 })
        },
        userAgent: 'Node.js Test Agent (WebKit Mock)'
    };
    const mockWin = {
        localStorage: mockStorage,
        navigator: mockNav,
        document: mockDoc
    };

    try {
        Object.defineProperty(globalThis, 'localStorage', {
            value: mockStorage,
            configurable: true,
            writable: true
        });
    } catch (e) {
        globalThis.localStorage = mockStorage;
    }

    try {
        Object.defineProperty(globalThis, 'navigator', {
            value: mockNav,
            configurable: true,
            writable: true
        });
    } catch (e) {
        globalThis.navigator = mockNav;
    }

    try {
        Object.defineProperty(globalThis, 'document', {
            value: mockDoc,
            configurable: true,
            writable: true
        });
    } catch (e) {
        globalThis.document = mockDoc;
    }

    try {
        Object.defineProperty(globalThis, 'window', {
            value: mockWin,
            configurable: true,
            writable: true
        });
    } catch (e) {
        globalThis.window = mockWin;
    }

    globalThis.confirm = () => true;
    globalThis.alert = () => {};

    return () => {
        try {
            if (originalLocalStorage) {
                Object.defineProperty(globalThis, 'localStorage', { value: originalLocalStorage, configurable: true });
            }
            if (originalNavigator) {
                Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true });
            }
            if (originalDocument) {
                Object.defineProperty(globalThis, 'document', { value: originalDocument, configurable: true });
            }
            if (originalWindow) {
                Object.defineProperty(globalThis, 'window', { value: originalWindow, configurable: true });
            }
        } catch (e) {}
    };
}
