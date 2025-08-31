import { useState, useMemo, useEffect } from 'react';
import { debounce, scheduleMicrotask } from '../lib/schedule';
import { track } from '../lib/analytics/client';
import { captureUtmFromLocation, attachUtm } from '../lib/analytics/utm';
export function BookingForm({ routeId, preselectedCarType = 'HATCHBACK', onBooked, defaultOrigin = '', defaultDestination = '' }) {
    const [originText, setOriginText] = useState(defaultOrigin);
    const [destinationText, setDestinationText] = useState(defaultDestination);
    const [pickupDt, setPickupDt] = useState('');
    const [carType, setCarType] = useState(preselectedCarType); // now selectable
    const [customerPhone, setCustomerPhone] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [otp, setOtp] = useState('');
    const [otpStatus, setOtpStatus] = useState('idle');
    const [otpMessage, setOtpMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [discountCode, setDiscountCode] = useState('');
    const [validOffers, setValidOffers] = useState([]);
    const [offerStatus, setOfferStatus] = useState('');
    const [quote, setQuote] = useState(null);
    const [farePreview, setFarePreview] = useState(null);
    const [offersVersion, setOffersVersion] = useState();
    const [canResend, setCanResend] = useState(false);
    const STORAGE_KEY = 'bookingForm:v1';
    const loadOffers = useMemo(() => debounce(async () => {
        try {
            const r = await fetch('/api/admin/offers?page=1&pageSize=200');
            const j = await r.json();
            if (j.ok) {
                const now = Date.now();
                // Filter in microtask to keep fetch resolution fast
                const activeOffers = j.offers.filter(o => o.active && (!o.valid_from || new Date(o.valid_from).getTime() <= now) && (!o.valid_to || new Date(o.valid_to).getTime() >= now));
                const codes = activeOffers.map(o => o.code.toUpperCase());
                setValidOffers(codes);
                setOffersVersion(j.version);
                // store details for discount computation
                window.__activeOffers = activeOffers;
            }
        }
        catch { }
    }, 150), []);
    useEffect(() => { if (validOffers.length === 0)
        loadOffers(); }, [validOffers.length, loadOffers]);
    useEffect(() => { captureUtmFromLocation(); }, []);
    // Load persisted values
    useEffect(() => {
        try {
            const raw = typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const data = JSON.parse(raw);
                if (data.originText)
                    setOriginText(data.originText);
                if (data.destinationText)
                    setDestinationText(data.destinationText);
                if (data.pickupDt)
                    setPickupDt(data.pickupDt);
                if (data.customerPhone)
                    setCustomerPhone(data.customerPhone);
                if (data.customerName)
                    setCustomerName(data.customerName);
                if (data.discountCode) {
                    setDiscountCode(data.discountCode);
                    scheduleMicrotask(() => recalcDiscountPreview(data.discountCode));
                }
            }
        }
        catch { }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Persist on change (debounced via microtask scheduling)
    useEffect(() => {
        try {
            const payload = { originText, destinationText, pickupDt, customerPhone, customerName, discountCode };
            scheduleMicrotask(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(payload)); });
        }
        catch { }
    }, [originText, destinationText, pickupDt, customerPhone, customerName, discountCode]);
    const computeQuote = useMemo(() => debounce(async () => {
        if (!originText || !destinationText)
            return;
        try {
            const r = await fetch('/api/quotes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origin_text: originText, destination_text: destinationText, car_type: carType }) });
            const j = await r.json();
            if (j.ok) {
                setQuote(j.data);
                setFarePreview(j.data.fare_quote_inr);
            }
        }
        catch { }
    }, 250), [originText, destinationText, carType]);
    useEffect(() => { if (originText && destinationText)
        computeQuote(); }, [originText, destinationText, computeQuote]);
    function recalcDiscountPreview(code) {
        if (!quote) {
            setFarePreview(null);
            return;
        }
        if (!code || !validOffers.includes(code.toUpperCase())) {
            setFarePreview(quote.fare_quote_inr);
            return;
        }
        const list = window.__activeOffers || [];
        const offer = list.find((o) => o.code.toUpperCase() === code.toUpperCase());
        if (!offer) {
            setFarePreview(quote.fare_quote_inr);
            return;
        }
        let discounted = quote.fare_quote_inr;
        if (offer.discount_type === 'FLAT')
            discounted = Math.max(0, discounted - offer.value);
        else if (offer.discount_type === 'PCT') {
            const cut = Math.round(discounted * (offer.value / 100));
            discounted = discounted - cut;
        }
        if (offer.cap_inr != null && offer.discount_type === 'PCT') {
            const maxDiscount = offer.cap_inr;
            const applied = quote.fare_quote_inr - discounted;
            if (applied > maxDiscount)
                discounted = quote.fare_quote_inr - maxDiscount;
        }
        setFarePreview(discounted);
    }
    async function sendOtp() {
        if (!/^[0-9]{10}$/.test(customerPhone)) {
            setOtpMessage('Enter valid 10 digit phone');
            setOtpStatus('error');
            return;
        }
        try {
            setOtpStatus('idle');
            setOtpMessage('');
            setCanResend(false);
            const r = await fetch('/api/otp/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: customerPhone }) });
            const j = await r.json();
            if (j.ok) {
                setOtpStatus('sent');
                setOtpMessage(j.otp ? `OTP sent (DEV: ${j.otp})` : 'OTP sent');
            }
            else {
                setOtpStatus('error');
                setOtpMessage(j.error || 'OTP failed');
            }
            if (j.ok) {
                track('otp_sent', attachUtm({ origin: originText, destination: destinationText, phone: customerPhone }));
            }
        }
        catch (e) {
            setOtpStatus('error');
            setOtpMessage(e.message || 'OTP error');
        }
        finally {
            // Enable resend after 30s if not yet verified
            setTimeout(() => { if (otpStatus !== 'verified')
                setCanResend(true); }, 30000);
        }
    }
    async function verify() {
        if (!otp)
            return;
        try {
            const r = await fetch('/api/otp/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: customerPhone, otp }) });
            const j = await r.json();
            if (j.ok && j.verified) {
                setOtpStatus('verified');
                setOtpMessage('OTP verified');
                track('otp_verified', attachUtm({ origin: originText, destination: destinationText }));
            }
            else {
                setOtpStatus('error');
                setOtpMessage(j.error || 'Invalid OTP');
            }
        }
        catch (e) {
            setOtpStatus('error');
            setOtpMessage(e.message || 'Verify error');
        }
    }
    async function submit(e) {
        e.preventDefault();
        if (otpStatus !== 'verified')
            return;
        setSubmitting(true);
        try {
            const r = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                    phone: customerPhone,
                    otp,
                    origin_text: originText,
                    destination_text: destinationText,
                    pickup_datetime: pickupDt || new Date().toISOString(),
                    car_type: carType,
                    route_id: routeId,
                    customer_name: customerName || undefined,
                    discount_code: discountCode && validOffers.includes(discountCode.toUpperCase()) ? discountCode.toUpperCase() : undefined
                }) });
            const j = await r.json();
            if (j.ok) {
                setOtpMessage(`Booking confirmed. ID: ${j.booking.id}`);
                const eventId = j.booking.event_id;
                track('booking_created', attachUtm({ origin: originText, destination: destinationText, car_type: carType, fare: j.booking.fare_quote_inr || (quote === null || quote === void 0 ? void 0 : quote.fare_quote_inr), booking_id: String(j.booking.id), payment_mode: 'COD', event_id: eventId }));
                if (onBooked)
                    onBooked(j.booking.id);
            }
            else {
                setOtpStatus('error');
                setOtpMessage(j.error || 'Booking failed – please retry.');
            }
        }
        catch (err) {
            setOtpStatus('error');
            setOtpMessage(err.message || 'Network error – booking not saved.');
        }
        finally {
            setSubmitting(false);
        }
    }
    const errors = {};
    if (otpStatus === 'error' && otpMessage)
        errors['otp'] = otpMessage;
    if (otpStatus === 'error' && /Enter valid/.test(otpMessage))
        errors['customer_phone'] = otpMessage;
    return (<form aria-labelledby="bookingHeading" noValidate onSubmit={submit} style={{ display: 'grid', gap: 10, maxWidth: 400 }}>
      <h2 id="bookingHeading" style={{ marginBottom: 4 }}>Book this Route</h2>
      <div>
        <label htmlFor="origin_text">Origin</label>
        <input id="origin_text" name="origin_text" value={originText} onChange={e => { const v = e.target.value; setOriginText(v); }} required type="text" autoComplete="address-level2"/>
      </div>
      <div>
        <label htmlFor="destination_text">Destination</label>
        <input id="destination_text" name="destination_text" value={destinationText} onChange={e => { const v = e.target.value; setDestinationText(v); }} required type="text" autoComplete="address-level2"/>
      </div>
      <div>
        <label htmlFor="pickup_datetime">Pickup Date/Time</label>
        <input id="pickup_datetime" name="pickup_datetime" type="datetime-local" value={pickupDt} onChange={e => setPickupDt(e.target.value)} required/>
      </div>
      <fieldset style={{ border: '1px solid #ccc', padding: 10, borderRadius: 6 }}>
        <legend style={{ fontSize: 14, fontWeight: 600 }}>Car Type</legend>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['HATCHBACK', 'SEDAN', 'SUV'].map(ct => {
            const active = carType === ct;
            return <button key={ct} type="button" onClick={() => setCarType(ct)} aria-pressed={active} style={{
                    flex: '1 1 100px',
                    minWidth: 100,
                    minHeight: 44,
                    background: active ? '#064' : '#0a7b83',
                    border: active ? '2px solid #032' : '2px solid #055',
                    color: '#fff',
                    fontWeight: 600,
                    borderRadius: 8,
                    boxShadow: active ? '0 0 0 2px #ffbf47 inset' : 'none'
                }}>{ct}</button>;
        })}
        </div>
        <input type="hidden" name="car_type" value={carType}/>
      </fieldset>
      <div>
        <label htmlFor="customer_phone">Phone</label>
        <input id="customer_phone" name="customer_phone" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} required pattern="[0-9]{10}" inputMode="tel" type="tel" aria-describedby="phoneHelp" aria-invalid={errors.customer_phone ? 'true' : undefined}/>
        <small id="phoneHelp">10 digit mobile number (numbers only)</small>
  {errors.customer_phone && <div id="phone_error" role="alert" aria-live="assertive" style={{ color: '#b00', fontSize: 12, marginTop: 4 }}>{errors.customer_phone}</div>}
      </div>
      <div>
        <label htmlFor="customer_name">Name (optional)</label>
        <input id="customer_name" name="customer_name" value={customerName} onChange={e => setCustomerName(e.target.value)} type="text" autoComplete="name"/>
      </div>
      <div>
        <label htmlFor="discount_code">Offer Code</label>
        <input id="discount_code" name="discount_code" value={discountCode} onChange={e => { const v = e.target.value.trim(); setDiscountCode(v); scheduleMicrotask(() => { if (!v) {
        setOfferStatus('');
        recalcDiscountPreview('');
    }
    else {
        const ok = validOffers.includes(v.toUpperCase());
        setOfferStatus(ok ? 'Applied' : 'Invalid');
        recalcDiscountPreview(v);
    } }); }} placeholder="Enter code" type="text" aria-describedby="discountHelp"/>
        <small style={{ color: offerStatus === 'Applied' ? '#064' : '#a00' }}>{offerStatus}</small>
      </div>
      {quote && <div style={{ background: '#f1f5f9', padding: '8px 10px', borderRadius: 4, fontSize: 14 }} aria-live="polite">
        <strong>Estimated Fare:</strong> ₹{quote.fare_quote_inr}{farePreview != null && farePreview !== quote.fare_quote_inr && <> → <span style={{ color: '#056' }}>₹{farePreview}</span></>}
        <div style={{ fontSize: 12, marginTop: 4 }}>Distance ~ {quote.distance_km} km • Duration ~ {quote.duration_min} min</div>
      </div>}
      {otpStatus !== 'verified' && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }} aria-describedby="otpHelp" data-inline>
        <button type="button" onClick={sendOtp} disabled={(!canResend && otpStatus === 'sent') || !/^[0-9]{10}$/.test(customerPhone)} aria-controls="otp_input" aria-disabled={(!canResend && otpStatus === 'sent') || !/^[0-9]{10}$/.test(customerPhone) ? 'true' : undefined}>{otpStatus === 'sent' ? (canResend ? 'Resend OTP' : 'OTP Sent') : 'Send OTP'}</button>
        {otpStatus === 'sent' && <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <label htmlFor="otp_input" className="visually-hidden">One Time Password</label>
          <input id="otp_input" name="otp" placeholder="OTP" aria-required="true" aria-describedby="otpHelp" value={otp} onChange={e => setOtp(e.target.value)} pattern="[0-9]{4}" inputMode="numeric" maxLength={4} style={{ width: 90 }}/>
          <button type="button" onClick={verify} disabled={otp.length !== 4} aria-label="Verify OTP">Verify</button>
        </div>}
        <div id="otpHelp" style={{ fontSize: 11, color: '#555' }}>{otpStatus === 'sent' ? 'Enter the 4 digit code sent to your phone.' : 'Enter phone number then press Send OTP.'}</div>
      </div>}
  <div aria-live="polite" role={otpStatus === 'error' ? 'alert' : undefined} style={{ minHeight: 18, fontSize: 12, color: otpStatus === 'error' ? '#b00' : '#064' }}>{otpMessage}</div>
  <button type="submit" disabled={otpStatus !== 'verified' || submitting} style={{ minHeight: 48, fontSize: 16 }}>{submitting ? 'Booking...' : 'Confirm Booking (Cash)'}</button>
      <style jsx>{`
        form input { width:100%; padding:10px; border:1px solid #ccc; border-radius:6px; font-size:16px; }
        form button { background:#075; color:#fff; border:none; padding:10px 14px; border-radius:8px; cursor:pointer; font-size:15px; }
        form button[disabled]{ opacity:0.6; cursor:not-allowed; }
        form button:focus { outline:2px solid #042; }
        .visually-hidden { position:absolute; left:-9999px; top:auto; width:1px; height:1px; overflow:hidden; }
        fieldset{margin:0;}
        @media (max-width:480px){
          form { max-width:100%; padding:0 4px; }
        }
      `}</style>
    </form>);
}
export default BookingForm;
