import { createMocks } from 'node-mocks-http';
import { issueManageSession, readManageSession, clearManageSession } from '../lib/myBookingsSession';

describe('myBookingsSession helpers', () => {
  const originalSecret = process.env.MB_SESSION_SECRET;
  const originalTtl = process.env.MB_SESSION_TTL_HOURS;

  beforeEach(() => {
    process.env.MB_SESSION_SECRET = 'test-secret';
    process.env.MB_SESSION_TTL_HOURS = '1';
  });

  afterAll(() => {
    process.env.MB_SESSION_SECRET = originalSecret;
    process.env.MB_SESSION_TTL_HOURS = originalTtl;
  });

  it('issues and reads sessions', () => {
    const { res } = createMocks();
    const issued = issueManageSession(res as any, '9876543210');
    expect(issued.token).toBeTruthy();
    const header = res.getHeader('Set-Cookie');
    expect(header).toBeTruthy();
    const cookie = Array.isArray(header) ? header[0] : (header as string);
    const { req } = createMocks({ headers: { cookie: cookie.split(';')[0] } });
    const session = readManageSession(req as any);
    expect(session).not.toBeNull();
    expect(session?.phone).toBe('9876543210');
  });

  it('clears sessions by setting expiry', () => {
    const { res } = createMocks();
    clearManageSession(res as any);
    const header = res.getHeader('Set-Cookie');
    expect(header).toBeTruthy();
    const cookie = Array.isArray(header) ? header[0] : (header as string);
    expect(cookie).toContain('Max-Age=0');
  });
});
