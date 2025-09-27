#!/usr/bin/env node
/* eslint-disable no-console */
const { spawn } = require('child_process');
const { PrismaClient } = require('@prisma/client');
const { startServer, stopServer } = require('./dev-server');

const prisma = new PrismaClient();

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: 'inherit', shell: false, ...options });
    proc.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`));
      }
    });
  });
}

function buildBookingPayload(index) {
  const pickup = new Date(Date.now() + (index + 1) * 60 * 60 * 1000);
  const basePhone = 9876500000 + index;
  return {
    origin: 'Raipur',
    destination: 'Bilaspur',
    pickup_datetime: pickup.toISOString(),
    return_datetime: null,
    passengers: '2',
    luggage: '1',
    cab_id: `CAB-${Date.now()}-${index}`,
    cab_category: 'Sedan',
    cab_type: 'Sedan',
    fare: 1500 + index * 100,
    estimated_duration: '3 hours',
    estimated_distance: '120 km',
    passenger_name: `Test Passenger ${index + 1}`,
    passenger_phone: String(basePhone),
  };
}

async function createBooking(baseUrl, payload) {
  const response = await fetch(`${baseUrl}/api/bookings/simple`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create booking (${response.status}): ${text}`);
  }
  return response.json();
}

async function fetchBooking(baseUrl, id) {
  const response = await fetch(`${baseUrl}/api/v1/bookings/${id}`);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to fetch booking ${id} (${response.status}): ${text}`);
  }
  return response.json();
}

async function main() {
  const summary = { createdIds: [], initialCount: 0, afterCreate: 0, afterRestart: 0 };
  try {
    console.log('> Applying migrations');
    await runCommand('npx', ['prisma', 'migrate', 'deploy']);

    summary.initialCount = await prisma.booking.count();
    console.log(`> Initial booking count: ${summary.initialCount}`);

    const serverInfo = await startServer();
    const baseUrl = serverInfo.url;

    const payloads = [0, 1, 2].map((index) => buildBookingPayload(index));
    for (const payload of payloads) {
      const result = await createBooking(baseUrl, payload);
      const bookingId = Number(result.booking_id);
      if (!Number.isFinite(bookingId)) {
        throw new Error(`Invalid booking id received: ${JSON.stringify(result)}`);
      }
      summary.createdIds.push(bookingId);
      console.log(`> Created booking ${bookingId}`);
    }

    summary.afterCreate = await prisma.booking.count();
    if (summary.afterCreate < summary.initialCount + payloads.length) {
      throw new Error('Booking count did not increase as expected');
    }
    console.log(`> Booking count after creation: ${summary.afterCreate}`);

    for (const id of summary.createdIds) {
      const response = await fetchBooking(baseUrl, id);
      if (!response.booking || Number(response.booking.booking_id) !== id) {
        throw new Error(`Manage endpoint did not return booking ${id}`);
      }
    }
    console.log('> Manage endpoint returned all bookings');

    await stopServer();
    console.log('> Server stopped');

    summary.afterStop = await prisma.booking.count();
    if (summary.afterStop !== summary.afterCreate) {
      throw new Error('Booking count changed after stopping server');
    }

    const serverInfoRestarted = await startServer();
    console.log('> Server restarted');
    summary.afterRestart = await prisma.booking.count();
    if (summary.afterRestart !== summary.afterCreate) {
      throw new Error('Booking count changed after restart');
    }

    for (const id of summary.createdIds) {
      const response = await fetchBooking(serverInfoRestarted.url, id);
      if (!response.booking || Number(response.booking.booking_id) !== id) {
        throw new Error(`Manage endpoint lost booking ${id} after restart`);
      }
    }

    await stopServer();
    console.log('> Server stopped after verification');

    console.log('✅ Persistence E2E passed');
    console.table({
      initial: summary.initialCount,
      afterCreate: summary.afterCreate,
      afterRestart: summary.afterRestart,
    });
  } catch (error) {
    console.error('❌ Persistence E2E failed:', error);
    process.exitCode = 1;
  } finally {
    await stopServer();
    await prisma.$disconnect();
  }
}

main();
