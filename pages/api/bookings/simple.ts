import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import { validatePhoneNumber } from '@/lib/validate';
import { persistSimpleBooking, SimpleBookingPayload } from '@/lib/simpleBookingPersistence';

type SimpleBookingRequest = SimpleBookingPayload;

interface BookingResponse {
  success: boolean;
  booking_id?: string;
  message?: string;
  error?: string;
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

const prisma = new PrismaClient();

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

    const normalizedPhone = phoneValidation.normalized || passenger_phone;

    if (cab_type !== undefined && typeof cab_type !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid cab type'
      });
    }

    if (cab_category !== undefined && typeof cab_category !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid cab category'
      });
    }

    const normalizedCabType =
      typeof cab_type === 'string' && cab_type.trim().length > 0 ? cab_type.trim() : undefined;

    const record = await persistSimpleBooking(prisma, {
      origin,
      destination,
      pickup_datetime,
      return_datetime,
      passengers: passengers || '1',
      luggage: luggage || '0',
      cab_id,
      cab_category,
      cab_type: normalizedCabType,
      fare,
      estimated_duration,
      estimated_distance,
      passenger_name,
      passenger_phone: normalizedPhone,
    });

    const bookingPayload = {
      booking_id: record.id,
      origin: origin.trim(),
      destination: destination.trim(),
      pickup_datetime,
      return_datetime,
      passengers: passengers || '1',
      luggage: luggage || '0',
      cab_id,
      cab_category,
      cab_type: normalizedCabType || 'UNKNOWN',
      fare,
      estimated_duration,
      estimated_distance,
      passenger_name: passenger_name.trim(),
      passenger_phone: normalizedPhone,
      status: record.status,
      payment_mode: record.payment_mode,
      created_at: record.created_at,
    };

    await sendBookingNotification(bookingPayload);

    return res.status(200).json({
      success: true,
      booking_id: String(record.id),
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
