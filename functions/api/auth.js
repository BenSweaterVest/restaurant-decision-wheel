/**
 * Authentication API Endpoint
 *
 * Validates administrative credentials and issues JWT tokens with expiration.
 *
 * Endpoint: POST /api/auth
 *
 * Request Body:
 * {
 *   "password": string
 * }
 *
 * Response:
 * {
 *   "authenticated": boolean,
 *   "token": string (JWT token)
 * }
 *
 * Environment Variables:
 * - ADMIN_PASSWORD: Administrative authentication credential
 * - JWT_SECRET: Secret key for signing JWT tokens (minimum 32 characters)
 *
 * Security Notes:
 * - Tokens expire after 1 hour
 * - Uses HMAC-SHA256 for token signing
 * - Rate limiting recommended in production
 */

import jwt from '@tsndr/cloudflare-worker-jwt';
import { getCorsHeaders, successResponse, checkRateLimit } from './_shared.js';

export async function onRequestPost(context) {
  const { request, env } = context;

  // Apply rate limiting: 5 attempts per minute
  const rateCheck = checkRateLimit(request, 5, 60000);
  if (!rateCheck.allowed) {
    return new Response(
      JSON.stringify({
        authenticated: false,
        error: 'Too many authentication attempts. Please try again later.',
        retryAfter: rateCheck.resetAt
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((rateCheck.resetAt.getTime() - Date.now()) / 1000),
          ...getCorsHeaders(env)
        }
      }
    );
  }

  try {
    const { password } = await request.json();

    // Validate required environment variables
    if (!env.JWT_SECRET) {
      return new Response(
        JSON.stringify({
          authenticated: false,
          error: 'Server configuration error: JWT_SECRET not set'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(env)
          }
        }
      );
    }

    // Validate credentials against environment configuration
    if (password === env.ADMIN_PASSWORD) {
      // Generate secure session ID
      const sessionId = crypto.randomUUID();

      // Create JWT payload
      const payload = {
        sessionId: sessionId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour expiration
      };

      // Sign JWT token
      const token = await jwt.sign(payload, env.JWT_SECRET);

      return successResponse(
        {
          authenticated: true,
          token: token
        },
        env
      );
    } else {
      return new Response(
        JSON.stringify({
          authenticated: false,
          error: 'Invalid password'
        }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
            ...getCorsHeaders(env)
          }
        }
      );
    }
  } catch (error) {
    console.error('Authentication error:', error);
    return new Response(
      JSON.stringify({
        authenticated: false,
        error: 'Invalid request'
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(env)
        }
      }
    );
  }
}

/**
 * CORS Preflight Handler
 * Responds to OPTIONS requests for cross-origin resource sharing
 */
export async function onRequestOptions(context) {
  return new Response(null, {
    headers: getCorsHeaders(context.env)
  });
}
