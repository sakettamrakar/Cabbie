export async function adminFetch(input:RequestInfo | URL, init:RequestInit = {}){
  const csrf = typeof window !== 'undefined' ? sessionStorage.getItem('csrfToken') : null;
  const method = (init.method || 'GET').toUpperCase();
  const headers = new Headers(init.headers || {});
  if(method !== 'GET' && method !== 'HEAD'){
    if(csrf && !headers.has('x-csrf-token')) headers.set('x-csrf-token', csrf);
    if(!headers.has('Content-Type') && !(init.body instanceof FormData)) headers.set('Content-Type','application/json');
  }
  return fetch(input, { ...init, headers });
}
