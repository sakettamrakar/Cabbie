import { buildTitleFare, buildTitleContent, buildMetaDescription, canonicalForFare, canonicalForContent, robotsMeta, uniqueKeyForPage } from '../lib/seo';

describe('seo helpers', ()=>{
  test('buildTitleFare', ()=>{
    expect(buildTitleFare('raipur','bilaspur',1200,'MyBrand')).toBe('Raipur to Bilaspur Taxi Fare from ₹1200 | MyBrand');
  });
  test('buildTitleContent variants', ()=>{
    expect(buildTitleContent('raipur','bilaspur','MyBrand','priceFirst')).toBe('Raipur to Bilaspur Taxi - Affordable Fares | MyBrand');
    expect(buildTitleContent('raipur','bilaspur','MyBrand','benefitFirst')).toBe('Reliable Raipur to Bilaspur Cabs | MyBrand');
  });
  test('buildMetaDescription with benefits limited to 3', ()=>{
    const desc = buildMetaDescription({ origin:'raipur', destination:'bilaspur', price:999, benefits:['AC Cars','Professional Drivers','24x7 Support','ExtraIgnored'] });
    expect(desc).toBe('Book Raipur to Bilaspur cab at fixed fare ₹999. Toll & GST included, doorstep pickup. AC Cars, Professional Drivers, 24x7 Support.');
    expect(desc).not.toContain('ExtraIgnored');
  });
  test('canonicalForFare', ()=>{
    expect(canonicalForFare('a','b','example.com')).toBe('https://example.com/a/b/fare');
    expect(canonicalForFare('a','b','https://ex.com')).toBe('https://ex.com/a/b/fare');
  });
  test('canonicalForContent', ()=>{
    expect(canonicalForContent('a','b','example.com')).toBe('https://example.com/a/a-to-b-taxi.html');
  });
  test('robotsMeta', ()=>{
    expect(robotsMeta({ index:true, follow:false})).toBe('index,nofollow');
  });
  test('uniqueKeyForPage', ()=>{
    expect(uniqueKeyForPage({ type:'fare', origin:'a', destination:'b'})).toBe('fare:a:b');
    expect(uniqueKeyForPage({ type:'home'})).toBe('home:_:_');
  });
});
