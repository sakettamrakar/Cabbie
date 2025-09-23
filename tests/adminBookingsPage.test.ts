/**
 * @jest-environment jsdom
 */

import React from 'react';
import { act } from 'react-dom/test-utils';
import { createRoot } from 'react-dom/client';
import type { GetServerSidePropsContext } from 'next';
import AdminBookingsPage, { getServerSideProps } from '../pages/admin/bookings';

const TEST_ADMIN_KEY = 'test-admin-key';
(global as any).IS_REACT_ACT_ENVIRONMENT = true;

const mockRouter = {
  basePath: '',
  pathname: '/admin/bookings',
  route: '/admin/bookings',
  query: {},
  asPath: '/admin/bookings',
  back: jest.fn(),
  beforePopState: jest.fn(),
  prefetch: jest.fn().mockResolvedValue(undefined),
  push: jest.fn(),
  reload: jest.fn(),
  replace: jest.fn(),
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isFallback: false,
  isReady: true,
  isLocaleDomain: false,
  isPreview: false,
};

jest.mock('next/router', () => ({
  useRouter: () => mockRouter,
}));

describe('admin bookings page route', () => {
  const originalAdminKey = process.env.ADMIN_KEY;

  afterAll(() => {
    if (originalAdminKey === undefined) {
      delete process.env.ADMIN_KEY;
    } else {
      process.env.ADMIN_KEY = originalAdminKey;
    }
  });

  test('responds with 200 and renders bookings table', async () => {
    process.env.ADMIN_KEY = TEST_ADMIN_KEY;

    const res: { statusCode: number } = { statusCode: 200 };
    const context = {
      req: {} as any,
      res: res as any,
      query: { key: TEST_ADMIN_KEY },
    } as unknown as GetServerSidePropsContext;

    const result = await getServerSideProps(context);
    expect(res.statusCode).toBe(200);
    if (!('props' in result)) {
      throw new Error('Expected props to be returned from getServerSideProps');
    }

    const props = result.props as any;
    expect(props.accessState).toBe('granted');
    if (!props.initialKey) {
      props.initialKey = TEST_ADMIN_KEY;
    }

    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    mockRouter.query = { key: TEST_ADMIN_KEY };
    mockRouter.asPath = `/admin/bookings?key=${TEST_ADMIN_KEY}`;

    const mockBookings = [
      {
        booking_id: 101,
        customer_name: 'Test Rider',
        customer_phone: '9999999999',
        origin: 'Origin Plaza',
        destination: 'Destination Central',
        pickup_datetime: new Date('2025-01-12T12:30:00.000Z').toISOString(),
        car_type: 'SEDAN',
        fare: 1800,
        status: 'CONFIRMED',
        created_at: new Date('2025-01-11T11:00:00.000Z').toISOString(),
      },
    ];

    const originalFetch = (global as any).fetch;
    (global as any).fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        page: 1,
        pageSize: 10,
        total: mockBookings.length,
        bookings: mockBookings,
      }),
    });

    try {
      await act(async () => {
        root.render(React.createElement(AdminBookingsPage, props));
      });
      await act(async () => {
        await Promise.resolve();
      });
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const table = container.querySelector('table');
      expect(table).not.toBeNull();
      expect(container.querySelectorAll('tbody tr')).toHaveLength(mockBookings.length);
      expect(table?.textContent).toContain('Test Rider');
    } finally {
      await act(async () => {
        root.unmount();
      });
      container.remove();
      (global as any).fetch = originalFetch;
    }
  });
});
