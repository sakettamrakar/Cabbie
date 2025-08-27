// Legacy page neutralized to avoid dynamic route conflicts; kept for reference.
export const revalidate = 60;
export default function LegacyRaipurBilaspurRedirect(){
  if (typeof window !== 'undefined') {
    window.location.replace('/raipur/raipur-to-bilaspur-taxi.html');
  }
  return <main style={{padding:24,fontFamily:'system-ui'}}>
    <h1>Moved</h1>
    <p>This page moved to /raipur/raipur-to-bilaspur-taxi.html</p>
  </main>;
}