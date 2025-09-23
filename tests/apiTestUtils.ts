import { createMocks } from 'node-mocks-http';

interface RunApiOptions {
  query?: Record<string, any>;
  headers?: Record<string, any>;
  cookies?: Record<string, any>;
}

export async function runApi(handler: any, method: any, body?: any, options: RunApiOptions = {}){
  const { req, res } = createMocks({ method, body, query: options.query, headers: options.headers, cookies: options.cookies });
  await new Promise<void>((resolve) => {
    // Support handlers returning a promise
    const maybe = handler(req, res);
    if(maybe && typeof maybe.then === 'function'){
      maybe.then(()=>resolve());
    } else {
      // next.js api handlers end synchronously
      resolve();
    }
  });
  const status = res._getStatusCode();
  let data: any;
  try { data = res._getJSONData(); } catch { data = res._getData(); }
  return { status, data };
}
