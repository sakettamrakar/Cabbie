// Lightweight scheduling utilities for cooperative yielding / debouncing
// Avoid large long tasks blocking input responsiveness.
// Fallback types for requestIdleCallback
// (Next.js / TS may not have DOM lib including it by default)
const ric = typeof window !== 'undefined' && window.requestIdleCallback;
export function scheduleMicrotask(fn) {
    Promise.resolve().then(fn);
}
export function debounce(fn, delay = 250) {
    let t;
    let lastArgs;
    let lastThis;
    const wrapped = function (...args) {
        lastArgs = args;
        lastThis = this;
        if (t)
            clearTimeout(t);
        t = setTimeout(() => { fn.apply(lastThis, lastArgs); }, delay);
    };
    wrapped.cancel = () => { if (t)
        clearTimeout(t); };
    return wrapped;
}
export function chunkIterate(items, each, chunkSize = 50) {
    let i = 0;
    const len = items.length;
    function run(deadline) {
        let count = 0;
        while (i < len && count < chunkSize) {
            each(items[i], i);
            i++;
            count++;
        }
        if (i < len) {
            if (deadline && deadline.timeRemaining && deadline.timeRemaining() > 0) {
                run(deadline);
                return;
            }
            if (ric) {
                ric(run);
            }
            else {
                setTimeout(run, 0);
            }
        }
    }
    if (ric) {
        ric(run);
    }
    else {
        setTimeout(run, 0);
    }
}
