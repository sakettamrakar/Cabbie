export default function BookingSummary({ origin, destination, car, fare, pickup }) {
    return <section aria-labelledby="booking-summary-h">
    <h2 id="booking-summary-h">Trip Summary</h2>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
      <li><strong>Route:</strong> {origin} → {destination}</li>
      <li><strong>Pickup:</strong> {new Date(pickup).toLocaleString()}</li>
      <li><strong>Car:</strong> {car}</li>
      <li><strong>Fare:</strong> ₹{fare}</li>
    </ul>
  </section>;
}
