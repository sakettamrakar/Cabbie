import { useState, FormEvent, MouseEvent } from 'react';
import type { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { readManageSession } from '@/lib/myBookingsSession';
import { validatePhoneNumber, formatPhoneDisplay } from '@/lib/validate';
import styles from '@/styles/MyBookings.module.css';

interface ManageLoginProps {
  phonePrefill: string;
}

export const getServerSideProps: GetServerSideProps<ManageLoginProps> = async ({ req, query }) => {
  if (process.env.FEATURE_MY_BOOKINGS !== 'true') {
    return { notFound: true };
  }
  const session = readManageSession(req as any);
  if (session) {
    return { redirect: { destination: '/my-bookings/list', permanent: false } };
  }
  const queryPhone = query?.phone;
  const phonePrefill = typeof queryPhone === 'string' ? queryPhone : '';
  return { props: { phonePrefill } };
};

export default function ManageLogin({ phonePrefill }: ManageLoginProps) {
  const router = useRouter();
  const [phone, setPhone] = useState(() => phonePrefill.replace(/\D/g, ''));
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [mockOtp, setMockOtp] = useState('');

  const canSubmitPhone = validatePhoneNumber(phone).isValid && !isLoading;
  const canSubmitOtp = otp.trim().length === 4 && !isLoading;
  const phoneDisplay = phone ? formatPhoneDisplay(phone) : 'your phone number';

  async function sendOtp() {
    if (!validatePhoneNumber(phone).isValid) {
      setError('Please enter a valid 10-digit phone number.');
      return;
    }
    setIsLoading(true);
    setError('');
    setInfo('');
    setMockOtp('');
    try {
      const res = await fetch('/api/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Failed to send OTP');
      }
      if (data.mock_otp) {
        setMockOtp(String(data.mock_otp));
      }
      setStep('otp');
      setInfo('OTP sent. Please check your phone.');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP. Try again later.');
    } finally {
      setIsLoading(false);
    }
  }

  const handleRequestOtp = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendOtp();
  };

  const handleResendOtp = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    void sendOtp();
  };

  async function verifyOtp(e: FormEvent) {
    e.preventDefault();
    if (otp.trim().length !== 4) {
      setError('Please enter the 4-digit OTP.');
      return;
    }
    setIsLoading(true);
    setError('');
    setInfo('');
    try {
      const res = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otp.trim(), context: 'manage' }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data?.error || 'Invalid OTP');
      }
      setInfo('Login successful. Redirecting...');
      await router.replace('/my-bookings/list');
    } catch (err: any) {
      setError(err.message || 'Invalid OTP. Try again.');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Layout>
      <Head>
        <title>Manage My Bookings</title>
        <meta name="robots" content="noindex,nofollow" />
      </Head>
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.card}>
            <header className={styles.heading}>
              <h1>Manage My Bookings</h1>
              <p>Sign in with your phone number to view or cancel your upcoming rides.</p>
            </header>

            {step === 'phone' && (
              <form className={styles.form} onSubmit={handleRequestOtp}>
                <div className={styles.inputGroup}>
                  <label htmlFor="phone">Phone number</label>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
                    placeholder="Enter your 10-digit phone"
                    aria-describedby="phone-hint"
                  />
                  <p id="phone-hint" className={styles.hint}>
                    We’ll send a one-time password (OTP) to {phoneDisplay}.
                  </p>
                </div>
                <div className={styles.actions}>
                  <button type="submit" className={styles.primaryButton} disabled={!canSubmitPhone}>
                    {isLoading ? 'Sending OTP…' : 'Send OTP'}
                  </button>
                </div>
              </form>
            )}

            {step === 'otp' && (
              <form className={styles.form} onSubmit={verifyOtp}>
                <div className={styles.inputGroup}>
                  <label htmlFor="otp">Enter OTP</label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="4-digit code"
                    autoFocus
                  />
                </div>
                <div className={styles.meta}>
                  <span>
                    Sent to <strong>{formatPhoneDisplay(phone)}</strong>.
                  </span>
                  <button type="button" className={styles.primaryButton} onClick={handleResendOtp} disabled={isLoading}>
                    Resend OTP
                  </button>
                </div>
                <div className={styles.actions}>
                  <button type="submit" className={styles.primaryButton} disabled={!canSubmitOtp}>
                    {isLoading ? 'Verifying…' : 'Verify & Continue'}
                  </button>
                </div>
              </form>
            )}

            {mockOtp && (
              <p className={styles.mockOtp} aria-live="polite">
                Dev OTP: <strong>{mockOtp}</strong>
              </p>
            )}

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
            {info && (
              <p className={styles.success} role="status">
                {info}
              </p>
            )}
          </section>
        </div>
      </main>
    </Layout>
  );
}
