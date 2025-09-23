import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import type { GetServerSideProps, NextPage } from 'next';
import { useRouter } from 'next/router';
import styles from '../../styles/AdminBookings.module.css';
import type { AdminAccessState } from '../../lib/simpleAdminKeyAuth';
import { evaluateAdminAccess, getAdminKeyFromQuery } from '../../lib/simpleAdminKeyAuth';

type BookingRow = {
  booking_id: number;
  customer_name: string;
  customer_phone: string;
  origin: string;
  destination: string;
  pickup_datetime: string;
  car_type: string;
  fare: number;
  status: string;
  created_at: string;
};

type AdminBookingsPageProps = {
  accessState: AdminAccessState;
  initialKey: string | null;
};

const PAGE_SIZE = 10;

const statusLabelClass = (status: string): string => {
  switch (status.toUpperCase()) {
    case 'CONFIRMED':
      return styles.statusConfirmed;
    case 'CANCELLED':
      return styles.statusCancelled;
    default:
      return styles.statusPending;
  }
};

const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch (error) {
    return value;
  }
};

const formatCurrency = (amount: number) => {
  try {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
  } catch (error) {
    return `₹${amount}`;
  }
};

const AdminBookingsPage: NextPage<AdminBookingsPageProps> = ({ accessState, initialKey }) => {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingKey, setPendingKey] = useState('');
  const authKey = initialKey ?? '';

  const totalPages = useMemo(() => {
    return total > 0 ? Math.ceil(total / PAGE_SIZE) : 1;
  }, [total]);

  const fetchBookings = useCallback(async () => {
    if (accessState !== 'granted') return;
    setLoading(true);
    setError(null);

    try {
      const query = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (authKey) {
        query.append('key', authKey);
      }
      const response = await fetch(`/api/admin/bookings?${query.toString()}`);
      if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
      }
      const payload = await response.json();
      setBookings(payload.bookings || []);
      setTotal(payload.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [accessState, page, authKey]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    setPendingKey('');
  }, [accessState]);

  const handleKeySubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nextKey = pendingKey.trim();
      router.replace({ pathname: '/admin/bookings', query: nextKey ? { key: nextKey } : {} });
    },
    [pendingKey, router],
  );

  useEffect(() => {
    setPage(1);
  }, [authKey]);

  const handlePrevPage = () => {
    setPage((current) => Math.max(1, current - 1));
  };

  const handleNextPage = () => {
    setPage((current) => Math.min(totalPages, current + 1));
  };

  const renderUnauthorized = () => {
    if (accessState === 'forbidden') {
      return (
        <div className={styles.messageCard}>
          <h2>Admin access disabled</h2>
          <p>Set an <code>ADMIN_KEY</code> environment variable to enable this page in production.</p>
        </div>
      );
    }

    return (
      <div className={styles.messageCard}>
        <h2>Enter admin key</h2>
        <p className={styles.messageSubtitle}>Provide the configured key to view recent bookings.</p>
        <form onSubmit={handleKeySubmit} className={styles.keyForm}>
          <label htmlFor="admin-key" className={styles.label}>Admin key</label>
          <input
            id="admin-key"
            type="password"
            value={pendingKey}
            onChange={(event) => setPendingKey(event.target.value)}
            placeholder="Enter ADMIN_KEY"
            className={styles.input}
            autoComplete="off"
            required
          />
          <button type="submit" className={styles.submitButton}>Access dashboard</button>
        </form>
      </div>
    );
  };

  const renderTable = () => {
    if (loading) {
      return <div className={styles.messageCard}>Loading bookings…</div>;
    }
    if (error) {
      return <div className={styles.errorCard}>{error}</div>;
    }
    if (!bookings.length) {
      return <div className={styles.messageCard}>No bookings found.</div>;
    }

    const start = (page - 1) * PAGE_SIZE + 1;
    const end = Math.min(total, page * PAGE_SIZE);

    return (
      <div className={styles.tableSection}>
        <div className={styles.tableMeta}>
          Showing <strong>{start}</strong> – <strong>{end}</strong> of <strong>{total}</strong> bookings
        </div>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Origin</th>
                <th>Destination</th>
                <th>Pickup</th>
                <th>Car</th>
                <th>Fare</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.booking_id}>
                  <td>{booking.booking_id}</td>
                  <td>{booking.customer_name || '—'}</td>
                  <td>{booking.customer_phone}</td>
                  <td>{booking.origin}</td>
                  <td>{booking.destination}</td>
                  <td>{formatDateTime(booking.pickup_datetime)}</td>
                  <td>{booking.car_type}</td>
                  <td>{formatCurrency(booking.fare)}</td>
                  <td>
                    <span className={`${styles.statusBadge} ${statusLabelClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </td>
                  <td>{formatDateTime(booking.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.pagination}>
          <button type="button" onClick={handlePrevPage} disabled={page <= 1}>
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button type="button" onClick={handleNextPage} disabled={page >= totalPages}>
            Next
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Admin Bookings</title>
      </Head>
      <main className={styles.main}>
        <header className={styles.header}>
          <div>
            <h1 className={styles.title}>Bookings dashboard</h1>
            <p className={styles.subtitle}>Latest confirmed requests sorted by most recent first.</p>
          </div>
        </header>
        {accessState === 'granted' ? renderTable() : renderUnauthorized()}
      </main>
    </div>
  );
};

export const getServerSideProps: GetServerSideProps<AdminBookingsPageProps> = async (context) => {
  const key = getAdminKeyFromQuery(context.query as Record<string, string | string[] | undefined>) ?? null;
  const accessState = evaluateAdminAccess(key);
  if (accessState === 'missing-key') {
    context.res.statusCode = 401;
  } else if (accessState === 'forbidden') {
    context.res.statusCode = 403;
  }
  return {
    props: {
      accessState,
      initialKey: key,
    },
  };
};

export default AdminBookingsPage;
