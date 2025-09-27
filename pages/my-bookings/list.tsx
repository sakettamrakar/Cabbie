import { useState } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { PrismaClient } from '@prisma/client';
import Layout from '@/components/Layout';
import { readManageSession, clearManageSession } from '@/lib/myBookingsSession';
import styles from '@/styles/MyBookings.module.css';

interface BookingItem {
  id: number;
  origin_text: string;
  destination_text: string;
  pickup_datetime: string;
  car_type: string;
  fare_quote_inr: number;
  fare_locked_inr: number;
  status: string;
  created_at: string;
}

interface ManageListProps {
  bookings: BookingItem[];
  nextCursor: string | null;
  phone: string;
}

const TAKE = 20;

function formatDateTime(value: string) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
  };
}

export const getServerSideProps: GetServerSideProps<ManageListProps> = async ({ req, res }) => {
  if (process.env.FEATURE_MY_BOOKINGS !== 'true') {
    return { notFound: true };
  }
  const session = readManageSession(req as any);
  if (!session) {
    clearManageSession(res as any);
    return { redirect: { destination: '/my-bookings', permanent: false } };
  }
  const prisma = new PrismaClient();
  const rows = await prisma.booking.findMany({
    where: { customer_phone: session.phone },
    orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
    take: TAKE + 1,
  });
  await prisma.$disconnect();
  const hasMore = rows.length > TAKE;
  const subset = hasMore ? rows.slice(0, TAKE) : rows;
  const nextCursor = hasMore
    ? `${subset[subset.length - 1].created_at.toISOString()}_${subset[subset.length - 1].id}`
    : null;
  const bookings = subset.map((booking) => ({
    id: booking.id,
    origin_text: booking.origin_text,
    destination_text: booking.destination_text,
    pickup_datetime: booking.pickup_datetime.toISOString(),
    car_type: booking.car_type,
    fare_quote_inr: booking.fare_quote_inr,
    fare_locked_inr: booking.fare_locked_inr,
    status: booking.status,
    created_at: booking.created_at.toISOString(),
  }));
  return {
    props: {
      bookings,
      nextCursor,
      phone: session.phone,
    },
  };
};

export default function ManageList({ bookings: initial, nextCursor: initialCursor, phone }: ManageListProps) {
  const router = useRouter();
  const [bookings, setBookings] = useState(initial);
  const [cursor, setCursor] = useState(initialCursor);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const [error, setError] = useState('');

  const hasMore = Boolean(cursor);

  async function fetchMore() {
    if (!cursor) return;
    setLoadingMore(true);
    setError('');
    try {
      const res = await fetch(`/api/my-bookings?cursor=${encodeURIComponent(cursor)}`);
      const data = await res.json();
      if (res.status === 401) {
        await router.replace('/my-bookings');
        return;
      }
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Unable to load more bookings');
      }
      const newBookings: BookingItem[] = (data.bookings || []).map((item: any) => ({
        id: item.id,
        origin_text: item.origin_text,
        destination_text: item.destination_text,
        pickup_datetime: item.pickup_datetime,
        car_type: item.car_type,
        fare_quote_inr: item.fare_quote_inr,
        fare_locked_inr: item.fare_locked_inr,
        status: item.status,
        created_at: item.created_at,
      }));
      setBookings((prev) => [...prev, ...newBookings]);
      setCursor(data.next_cursor || null);
    } catch (err: any) {
      setError(err.message || 'Unable to load more bookings.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function logout() {
    setLoadingLogout(true);
    setError('');
    try {
      const res = await fetch('/api/my-bookings/logout', { method: 'POST' });
      if (!res.ok) {
        throw new Error('Failed to log out');
      }
      await router.replace('/my-bookings');
    } catch (err: any) {
      setError(err.message || 'Failed to log out.');
    } finally {
      setLoadingLogout(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>My Bookings</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.card}>
            <div className={styles.toolbar}>
              <div>
                <h1 style={{ margin: 0 }}>Your bookings</h1>
                <p className={styles.hint}>Signed in as +91 {phone.slice(-10)}</p>
              </div>
              <button className={styles.logoutButton} onClick={logout} disabled={loadingLogout}>
                {loadingLogout ? 'Logging out…' : 'Log out'}
              </button>
            </div>

            {bookings.length === 0 && <p className={styles.emptyState}>No bookings yet. Start by creating a new ride.</p>}

            <div className={styles.list}>
              {bookings.map((booking) => {
                const pickup = formatDateTime(booking.pickup_datetime);
                const created = formatDateTime(booking.created_at);
                const fare = booking.fare_locked_inr > 0 ? booking.fare_locked_inr : booking.fare_quote_inr;
                return (
                  <article key={booking.id} className={styles.bookingItem}>
                    <div className={styles.bookingHeader}>
                      <div>
                        <div className={styles.bookingRoute}>
                          {booking.origin_text} → {booking.destination_text}
                        </div>
                        <div className={styles.metaRow}>
                          <span>
                            <strong>Pickup:</strong> {pickup.date} at {pickup.time}
                          </span>
                          <span>
                            <strong>Car:</strong> {booking.car_type}
                          </span>
                          <span>
                            <strong>Fare:</strong> ₹{fare}
                          </span>
                        </div>
                      </div>
                      <span className={styles.badge}>{booking.status}</span>
                    </div>
                    <div className={styles.metaRow}>
                      <span>
                        <strong>ID:</strong> #{booking.id}
                      </span>
                      <span>
                        <strong>Created:</strong> {created.date} {created.time}
                      </span>
                    </div>
                  </article>
                );
              })}
            </div>

            {hasMore && (
              <button className={styles.loadMoreButton} onClick={fetchMore} disabled={loadingMore}>
                {loadingMore ? 'Loading…' : 'Load more'}
              </button>
            )}

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </section>
        </div>
      </main>
    </Layout>
  );
}
