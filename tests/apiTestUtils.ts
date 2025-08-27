import { createMocks } from 'node-mocks-http';

export async function runApi(handler: any, method: any, body?: any){
  const { req, res } = createMocks({ method, body });
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
