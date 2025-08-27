// Lightweight scheduling utilities for cooperative yielding / debouncing
// Avoid large long tasks blocking input responsiveness.

// Fallback types for requestIdleCallback
// (Next.js / TS may not have DOM lib including it by default)
const ric: any = typeof window !== 'undefined' && (window as any).requestIdleCallback;

export function scheduleMicrotask(fn: () => void){
  Promise.resolve().then(fn);
}

export function debounce<T extends (...args:any[])=>void>(fn:T, delay=250){
  let t: any; let lastArgs: any[]; let lastThis: any;
  const wrapped = function(this:any, ...args:any[]){
    lastArgs = args; lastThis = this;
    if(t) clearTimeout(t);
    t = setTimeout(()=>{ fn.apply(lastThis,lastArgs); }, delay);
  } as T & { cancel:()=>void };
  (wrapped as any).cancel = ()=>{ if(t) clearTimeout(t); };
  return wrapped;
}

export function chunkIterate<T>(items:T[], each:(item:T,index:number)=>void, chunkSize=50){
  let i=0; const len=items.length;
  function run(deadline?: IdleDeadline){
    let count=0;
    while(i < len && count < chunkSize){ each(items[i], i); i++; count++; }
    if(i < len){
      if(deadline && (deadline as any).timeRemaining && deadline.timeRemaining() > 0){
        run(deadline); return;
      }
      if(ric){
        ric(run);
      }else{
        setTimeout(run,0);
      }
    }
  }
  if(ric){ ric(run); } else { setTimeout(run,0); }
}
