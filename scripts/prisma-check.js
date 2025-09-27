#!/usr/bin/env node
/* eslint-disable no-console */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.booking.count();
    const last = await prisma.booking.findMany({
      orderBy: { id: 'desc' },
      take: 3,
    });
    console.log(`Bookings count: ${count}`);
    if (!last.length) {
      console.log('No bookings found');
      return;
    }
    console.log('Last bookings:');
    for (const booking of last) {
      console.log(`- #${booking.id} ${booking.origin_text} -> ${booking.destination_text} (${booking.created_at.toISOString()})`);
    }
  } catch (error) {
    console.error('Failed to query Prisma:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
