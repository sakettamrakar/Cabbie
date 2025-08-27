export type Locale = 'en' | 'hi';
const messages: Record<Locale, Record<string,string>> = {
  en: { updated_on: 'Updated on' },
  hi: { updated_on: 'अद्यतन तिथि' }
};
export function translate(key:string, locale:Locale='en'){
  const table = messages[locale] || messages.en;
  return table[key] || messages.en[key] || key;
}
export function routePath(locale:Locale, path:string){
  if(!path.startsWith('/')) path = '/' + path;
  if(locale==='en') return path;
  return `/${locale}${path}`;
}
export function enabledLocales(){
  const hi = process.env.ENABLE_HI_LOCALE === '1';
  return (['en'] as Locale[]).concat(hi? ['hi']: []);
}