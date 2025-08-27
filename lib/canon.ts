import { SITE_BASE_URL } from './seo';

function normDomain(domain?:string){
  const d = (domain || SITE_BASE_URL).replace(/\/$/,'');
  return d;
}

export function canonicalFor(path:string, domain?:string){
  if(!path.startsWith('/')) path = '/' + path;
  return normDomain(domain) + path;
}

export function alternateForReverseRoute(origin:string,destination:string, domain?:string){
  const d = normDomain(domain);
  return {
    fare: `${d}/${destination}/${origin}/fare`,
    content: `${d}/seo/${destination}/${origin}`
  };
}

export type ReverseAlternate = { fare:string; content:string };