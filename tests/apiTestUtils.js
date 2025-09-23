import { createMocks } from 'node-mocks-http';
export async function runApi(handler, method, body, options = {}) {
    const { req, res } = createMocks({ method, body, query: options.query, headers: options.headers, cookies: options.cookies });
    await new Promise((resolve) => {
        // Support handlers returning a promise
        const maybe = handler(req, res);
        if (maybe && typeof maybe.then === 'function') {
            maybe.then(() => resolve());
        }
        else {
            // next.js api handlers end synchronously
            resolve();
        }
    });
    const status = res._getStatusCode();
    let data;
    try {
        data = res._getJSONData();
    }
    catch {
        data = res._getData();
    }
    return { status, data };
}
