/**
 * Authentication API Tests
 *
 * Tests for /api/auth endpoint
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { onRequestPost, onRequestOptions } from '../../functions/api/auth.js';
import jwt from '@tsndr/cloudflare-worker-jwt';

describe('Authentication API', () => {
  let context;

  beforeEach(() => {
    context = createExecutionContext();
  });

  it('should return authenticated:true with valid password', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: env.ADMIN_PASSWORD })
    });

    const response = await onRequestPost({ request, env, context });
    await waitOnExecutionContext(context);

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.authenticated).toBe(true);
    expect(data.token).toBeDefined();

    // Verify token is a valid JWT
    const isValid = await jwt.verify(data.token, env.JWT_SECRET);
    expect(isValid).toBe(true);
  });

  it('should return authenticated:false with invalid password', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' })
    });

    const response = await onRequestPost({ request, env, context });
    await waitOnExecutionContext(context);

    expect(response.status).toBe(401);

    const data = await response.json();
    expect(data.authenticated).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should return error for invalid request body', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'invalid json'
    });

    const response = await onRequestPost({ request, env, context });
    await waitOnExecutionContext(context);

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.authenticated).toBe(false);
    expect(data.error).toBeDefined();
  });

  it('should handle OPTIONS request with CORS headers', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'OPTIONS'
    });

    const response = await onRequestOptions({ request, env, context });
    await waitOnExecutionContext(context);

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBeDefined();
    expect(response.headers.get('Access-Control-Allow-Methods')).toBeDefined();
  });

  it('should generate JWT token with expiration', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: env.ADMIN_PASSWORD })
    });

    const response = await onRequestPost({ request, env, context });
    const data = await response.json();

    // Decode JWT to verify payload
    const decoded = await jwt.decode(data.token);

    expect(decoded.payload.sessionId).toBeDefined();
    expect(decoded.payload.iat).toBeDefined();
    expect(decoded.payload.exp).toBeDefined();
    expect(decoded.payload.exp).toBeGreaterThan(decoded.payload.iat);
  });

  it('should enforce rate limiting after multiple attempts', async () => {
    // Make 5 requests (the limit)
    for (let i = 0; i < 5; i++) {
      const request = new Request('http://localhost/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'CF-Connecting-IP': '192.168.1.100'
        },
        body: JSON.stringify({ password: 'wrong' })
      });

      const response = await onRequestPost({ request, env, context });
      expect(response.status).toBeLessThan(500);
    }

    // 6th request should be rate limited
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': '192.168.1.100'
      },
      body: JSON.stringify({ password: 'wrong' })
    });

    const response = await onRequestPost({ request, env, context });
    expect(response.status).toBe(429);

    const data = await response.json();
    expect(data.error).toContain('Too many');
    expect(response.headers.get('Retry-After')).toBeDefined();
  });

  it('should return error if JWT_SECRET is not set', async () => {
    const request = new Request('http://localhost/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: env.ADMIN_PASSWORD })
    });

    // Create env without JWT_SECRET
    const envWithoutSecret = { ...env };
    delete envWithoutSecret.JWT_SECRET;

    const response = await onRequestPost({ request, env: envWithoutSecret, context });
    await waitOnExecutionContext(context);

    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toContain('JWT_SECRET');
  });
});
