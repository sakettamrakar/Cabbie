const messages = {
    en: { updated_on: 'Updated on' },
    hi: { updated_on: 'अद्यतन तिथि' }
};
export function translate(key, locale = 'en') {
    const table = messages[locale] || messages.en;
    return table[key] || messages.en[key] || key;
}
export function routePath(locale, path) {
    if (!path.startsWith('/'))
        path = '/' + path;
    if (locale === 'en')
        return path;
    return `/${locale}${path}`;
}
export function enabledLocales() {
    const hi = process.env.ENABLE_HI_LOCALE === '1';
    return ['en'].concat(hi ? ['hi'] : []);
}
