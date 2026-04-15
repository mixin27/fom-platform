import {
  ensureRequestContext,
  getSessionRequestMetadata,
  type RequestWithContext,
} from './request-context';

describe('request context', () => {
  it('derives request id, ip address, and user-agent from the request', () => {
    const request: RequestWithContext = {
      headers: {
        'x-forwarded-for': '203.0.113.10, 10.0.0.2',
        'user-agent': 'scalar-client/1.0',
      },
      ip: '127.0.0.1',
    };
    const response = {
      setHeader: jest.fn(),
    };

    ensureRequestContext(request, response);

    expect(request.requestId).toMatch(/^req_/);
    expect(request.ipAddress).toBe('203.0.113.10');
    expect(request.userAgent).toBe('scalar-client/1.0');
    expect(getSessionRequestMetadata(request)).toEqual({
      ipAddress: '203.0.113.10',
      userAgent: 'scalar-client/1.0',
      platform: 'unknown',
      deviceId: null,
      deviceName: null,
    });
    expect(response.setHeader).toHaveBeenCalledWith(
      'X-Request-Id',
      request.requestId,
    );
  });
});
