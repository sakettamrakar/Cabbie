import { NextApiRequest, NextApiResponse } from 'next';
import { validatePhoneNumber } from '@/lib/validate';

interface SimpleBookingRequest {
  // Trip details
  origin: string;
  destination: string;
  pickup_datetime: string;
  return_datetime?: string;
  passengers?: string;
  luggage?: string;
  
  // Selected cab details
  cab_id: string;
  cab_category: string;
  cab_type: string;
  fare: number;
  estimated_duration: string;
  estimated_distance: string;
  
  // Passenger details
  passenger_name: string;
  passenger_phone: string;
}

interface BookingResponse {
  success: boolean;
  booking_id?: string;
  message?: string;
  error?: string;
}

// Generate a unique booking ID
function generateBookingId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `CAB${timestamp}${random}`.toUpperCase();
}

// Simulate SMS/WhatsApp notification
async function sendBookingNotification(booking: any): Promise<void> {
  console.log('📱 SMS/WhatsApp Notification:', {
    phone: booking.passenger_phone,
    message: `Hi ${booking.passenger_name}, your cab booking ${booking.booking_id} from ${booking.origin} to ${booking.destination} is confirmed! Driver details will be shared soon.`
  });
  
  // TODO: Integrate with actual SMS/WhatsApp service
  // await smsService.send(booking.passenger_phone, message);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<BookingResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const {
      origin,
      destination,
      pickup_datetime,
      return_datetime,
      passengers,
      luggage,
      cab_id,
      cab_category,
      cab_type,
      fare,
      estimated_duration,
      estimated_distance,
      passenger_name,
      passenger_phone,
    }: SimpleBookingRequest = req.body;

    // Validate required fields
    if (!origin || !destination || !pickup_datetime || !cab_id || !passenger_name || !passenger_phone) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate passenger name
    if (passenger_name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Passenger name must be at least 2 characters'
      });
    }

    // Validate phone number
    const phoneValidation = validatePhoneNumber(passenger_phone);
    if (!phoneValidation.isValid) {
      return res.status(400).json({
        success: false,
        error: phoneValidation.error || 'Invalid phone number'
      });
    }

    // Validate pickup datetime
    const pickupDate = new Date(pickup_datetime);
    if (pickupDate.getTime() <= Date.now()) {
      return res.status(400).json({
        success: false,
        error: 'Pickup date must be in the future'
      });
    }

    // Validate fare
    if (typeof fare !== 'number' || fare <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid fare amount'
      });
    }

    // Generate booking ID
    const booking_id = generateBookingId();

    // Create booking object
    const booking = {
      booking_id,
      origin: origin.trim(),
      destination: destination.trim(),
      pickup_datetime,
      return_datetime,
      passengers: passengers || '1',
      luggage: luggage || '0',
      cab_id,
      cab_category,
      cab_type,
      fare,
      estimated_duration,
      estimated_distance,
      passenger_name: passenger_name.trim(),
      passenger_phone: phoneValidation.normalized || passenger_phone,
      status: 'PENDING',
      payment_mode: 'COD', // Default to Cash on Delivery
      created_at: new Date().toISOString(),
    };

    // TODO: Save to database
    // In a real application, you would save this to your database:
    /*
    const result = await db.bookings.create({
      data: {
        id: booking.booking_id,
        route_id: null, // Will be determined later
        origin_text: booking.origin,
        destination_text: booking.destination,
        pickup_datetime: new Date(booking.pickup_datetime),
        car_type: booking.cab_type.toUpperCase(),
        fare_quote_inr: booking.fare,
        payment_mode: 'COD',
        status: 'PENDING',
        customer_name: booking.passenger_name,
        customer_phone: booking.passenger_phone,
        // Additional fields for extended booking data
        cab_id: booking.cab_id,
        cab_category: booking.cab_category,
        estimated_duration: booking.estimated_duration,
        estimated_distance: booking.estimated_distance,
        passengers: parseInt(booking.passengers),
        luggage: parseInt(booking.luggage),
        return_datetime: booking.return_datetime ? new Date(booking.return_datetime) : null,
      }
    });
    */

    // For now, simulate database save with console log
    console.log('💾 Booking saved to database:', booking);

    // Send notification to passenger
    await sendBookingNotification(booking);

    // Return success response
    return res.status(200).json({
      success: true,
      booking_id,
      message: 'Booking confirmed successfully'
    });

  } catch (error) {
    console.error('Simple Booking API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
}
