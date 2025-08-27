export interface FareCardProps { carType:string; baseFare:number; distanceKm?:number; durationMin?:number; onSelect?: (carType:string)=>void }
export function FareCard({ carType, baseFare, distanceKm, durationMin, onSelect }: FareCardProps){
  return (
    <div className="fareCard" role="group" aria-label={`${carType} fare`}>
      <h3 style={{marginTop:0}}>{carType}</h3>
      <p style={{margin:'4px 0'}}>Base Fare: <strong aria-live="polite">₹{baseFare}</strong></p>
      {distanceKm!=null && <p style={{margin:'4px 0',fontSize:12,color:'#555'}}>{distanceKm} km • ~{durationMin} mins</p>}
      {onSelect && <button onClick={()=>onSelect(carType)} aria-label={`Select ${carType} for booking`}>Select</button>}
      <style jsx>{`
        .fareCard { border:1px solid #ddd; padding:12px; border-radius:8px; width:160px; background:#fff; box-shadow:0 1px 2px rgba(0,0,0,0.05); }
        .fareCard button { background:#0a6; color:#fff; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; }
        .fareCard button:focus { outline:2px solid #044; outline-offset:2px; }
      `}</style>
    </div>
  );
}
export default FareCard;
