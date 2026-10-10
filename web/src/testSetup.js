// jsdom does not perform layout or provide this browser API. Real pointer
// resizing is checked in the browser; unit tests cover state and keyboard use.
globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
};
