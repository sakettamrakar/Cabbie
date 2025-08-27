export interface RouteCardProps { origin:string; destination:string; distanceKm:number; fareSummary?:string }
export function RouteCard({ origin, destination, distanceKm, fareSummary }: RouteCardProps){
  const href = `/${origin}/${destination}/fare`;
  return (
    <a className="routeCard" href={href} aria-label={`View ${origin} to ${destination} cab fares`}>
      <strong>{origin} → {destination}</strong>
      <span>{distanceKm} km</span>
      {fareSummary && <em style={{fontStyle:'normal', color:'#055'}}>{fareSummary}</em>}
      <style jsx>{`
        .routeCard { display:flex; flex-direction:column; gap:2px; padding:12px; border:1px solid #ddd; border-radius:8px; text-decoration:none; color:#111; background:#fff; }
        .routeCard:focus { outline:2px solid #06a; outline-offset:2px; }
        .routeCard:hover { border-color:#06a; }
      `}</style>
    </a>
  );
}
export default RouteCard;
