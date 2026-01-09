/**
 * Shared Utilities for Restaurant Picker API
 *
 * This module contains common functions used across all API endpoints
 * to reduce code duplication and maintain consistency.
 *
 * @module api/_shared
 */

import { verify } from './jwt-helper.js';

const RESTAURANT_FILE = 'restaurants.json';

/**
 * Verify JWT authentication token from request headers
 * Validates token signature and expiration
 *
 * @param {Request} request - Incoming request object with Authorization header
 * @param {Object} env - Environment variables containing JWT_SECRET
 * @returns {Promise<boolean>} - True if authenticated, false otherwise
 *
 * @example
 * if (!(await verifyAuth(request, env))) {
 *   return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
 * }
 */
export async function verifyAuth(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }

  const token = authHeader.substring(7);
  try {
    // Verify JWT signature and expiration
    const isValid = await verify(token, env.JWT_SECRET);
    return isValid;
  } catch {
    return false;
  }
}

/**
 * Retrieve restaurant data file from GitHub repository
 *
 * @param {Object} env - Environment variables containing GitHub credentials
 * @returns {Promise<Object>} - Object containing parsed data and file SHA
 * @throws {Error} - If GitHub API request fails
 *
 * @example
 * const { data, sha } = await fetchFromGitHub(env);
 * console.log(data.restaurants); // Array of restaurants
 */
export async function fetchFromGitHub(env) {
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${RESTAURANT_FILE}?ref=${env.GITHUB_BRANCH}`;

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Restaurant-Picker-App'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  const responseData = await response.json();
  const content = atob(responseData.content);
  return {
    data: JSON.parse(content),
    sha: responseData.sha
  };
}

/**
 * Commit updated restaurant data to GitHub repository
 * Uses SHA-based conflict detection to prevent concurrent modification issues
 *
 * @param {Object} env - Environment variables containing GitHub credentials
 * @param {Object} content - Updated restaurant data object to commit
 * @param {string} sha - Current file SHA for conflict detection
 * @param {string} message - Commit message describing the change
 * @returns {Promise<Object>} - GitHub API response with new commit details
 * @throws {Error} - If GitHub update fails or SHA conflict occurs
 *
 * @example
 * await updateGitHub(env, data, sha, 'Add new restaurant: Pizza Palace');
 */
export async function updateGitHub(env, content, sha, message) {
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/contents/${RESTAURANT_FILE}`;

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'Restaurant-Picker-App'
    },
    body: JSON.stringify({
      message: message,
      content: btoa(JSON.stringify(content, null, 2)),
      sha: sha,
      branch: env.GITHUB_BRANCH
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub update failed: ${response.status} - ${error}`);
  }

  return await response.json();
}

/**
 * Generate CORS headers for API responses
 * Currently allows all origins - should be restricted in production
 *
 * @param {Object} env - Environment variables (can contain ALLOWED_ORIGIN)
 * @returns {Object} - Headers object with CORS configuration
 *
 * @example
 * return new Response(JSON.stringify(data), {
 *   headers: {
 *     'Content-Type': 'application/json',
 *     ...getCorsHeaders(env)
 *   }
 * });
 */
export function getCorsHeaders(env) {
  // For production deployments, set ALLOWED_ORIGIN environment variable
  // to restrict access to specific domains (e.g., 'https://yourdomain.com')
  // Default allows all origins for development flexibility
  const allowedOrigin = env.ALLOWED_ORIGIN || '*';

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

/**
 * Create a standardized error response
 *
 * @param {string} message - Error message to return
 * @param {number} status - HTTP status code (default: 500)
 * @param {Object} env - Environment variables for CORS headers
 * @returns {Response} - Formatted error response
 *
 * @example
 * return errorResponse('Restaurant not found', 404, env);
 */
export function errorResponse(message, status = 500, env = {}) {
  return new Response(
    JSON.stringify({
      error: message
    }),
    {
      status: status,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(env)
      }
    }
  );
}

/**
 * Create a standardized success response
 *
 * @param {Object} data - Data to return in response
 * @param {Object} env - Environment variables for CORS headers
 * @returns {Response} - Formatted success response
 *
 * @example
 * return successResponse({ restaurants: data.restaurants }, env);
 */
export function successResponse(data, env = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ...getCorsHeaders(env)
    }
  });
}

/**
 * Generate a UUID v4 (random UUID)
 * Used for generating unique restaurant IDs
 *
 * @returns {string} - UUID in format xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 *
 * @example
 * const newRestaurant = {
 *   id: generateUUID(),
 *   name: 'Pizza Palace',
 *   ...
 * };
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Validate service types array
 *
 * @param {Array<string>} serviceTypes - Array of service type strings
 * @returns {Object} - { valid: boolean, invalidTypes: Array<string> }
 *
 * @example
 * const validation = validateServiceTypes(['takeout', 'delivery', 'invalid']);
 * if (!validation.valid) {
 *   return errorResponse(`Invalid service types: ${validation.invalidTypes.join(', ')}`, 400, env);
 * }
 */
export function validateServiceTypes(serviceTypes) {
  const validServiceTypes = ['takeout', 'delivery', 'dine-in', 'at-home'];
  const invalidTypes = serviceTypes.filter((st) => !validServiceTypes.includes(st));

  return {
    valid: invalidTypes.length === 0,
    invalidTypes: invalidTypes
  };
}

/**
 * Validate profile ID format
 * Profile IDs must be lowercase alphanumeric with hyphens
 *
 * @param {string} profileId - Profile ID to validate
 * @returns {boolean} - True if valid format
 *
 * @example
 * if (!validateProfileId(newProfile.id)) {
 *   return errorResponse('Profile ID must contain only lowercase letters, numbers, and hyphens', 400, env);
 * }
 */
export function validateProfileId(profileId) {
  return /^[a-z0-9-]+$/.test(profileId);
}

/**
 * Validate URL format and optionally check if reachable
 *
 * @param {string} url - URL to validate
 * @param {boolean} checkReachable - Whether to verify URL is reachable (default: false)
 * @returns {Promise<Object>} - { valid: boolean, error: string|null }
 *
 * @example
 * const validation = await validateURL(menuLink, false);
 * if (!validation.valid) {
 *   console.warn('Invalid URL:', validation.error);
 * }
 */
export async function validateURL(url, checkReachable = false) {
  if (!url) {
    return { valid: true, error: null }; // Empty URLs are allowed
  }

  try {
    new URL(url);

    if (checkReachable) {
      // Optional: Check if URL is reachable
      const response = await fetch(url, { method: 'HEAD' });
      if (!response.ok) {
        return { valid: false, error: 'URL is not reachable' };
      }
    }

    return { valid: true, error: null };
  } catch (e) {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Sanitize and validate restaurant data
 *
 * @param {Object} restaurant - Restaurant object to validate
 * @returns {Object} - { valid: boolean, errors: Array<string> }
 *
 * @example
 * const validation = validateRestaurantData(newRestaurant);
 * if (!validation.valid) {
 *   return errorResponse(validation.errors.join(', '), 400, env);
 * }
 */
export function validateRestaurantData(restaurant) {
  const errors = [];

  // Required fields
  if (!restaurant.name || restaurant.name.trim() === '') {
    errors.push('Restaurant name is required');
  }

  if (!Array.isArray(restaurant.foodTypes) || restaurant.foodTypes.length === 0) {
    errors.push('At least one food type is required');
  }

  if (!Array.isArray(restaurant.serviceTypes) || restaurant.serviceTypes.length === 0) {
    errors.push('At least one service type is required');
  }

  // Validate service types
  if (Array.isArray(restaurant.serviceTypes)) {
    const serviceValidation = validateServiceTypes(restaurant.serviceTypes);
    if (!serviceValidation.valid) {
      errors.push(`Invalid service types: ${serviceValidation.invalidTypes.join(', ')}`);
    }
  }

  // Validate profiles array if provided
  if (restaurant.profiles && !Array.isArray(restaurant.profiles)) {
    errors.push('Profiles must be an array');
  }

  // Validate dietary restrictions if provided
  if (restaurant.dietaryRestrictions && !Array.isArray(restaurant.dietaryRestrictions)) {
    errors.push('Dietary restrictions must be an array');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Simple in-memory rate limiter for API endpoints
 * Uses IP address to track request rates
 *
 * Note: For production with multiple instances, consider using Cloudflare Workers KV
 * or Durable Objects for distributed rate limiting.
 *
 * @param {Request} request - Incoming request object
 * @param {number} maxRequests - Maximum requests allowed in time window (default: 10)
 * @param {number} windowMs - Time window in milliseconds (default: 60000 = 1 minute)
 * @returns {Object} - { allowed: boolean, remaining: number, resetAt: Date }
 *
 * @example
 * const rateCheck = checkRateLimit(request, 5, 60000);
 * if (!rateCheck.allowed) {
 *   return errorResponse('Rate limit exceeded', 429, env);
 * }
 */
const rateLimitStore = new Map();

export function checkRateLimit(request, maxRequests = 10, windowMs = 60000) {
  const clientIp = request.headers.get('CF-Connecting-IP') || 'unknown';
  const now = Date.now();
  const key = `${clientIp}`;

  // Clean up expired entries periodically
  if (rateLimitStore.size > 10000) {
    for (const [k, v] of rateLimitStore.entries()) {
      if (now > v.resetAt) {
        rateLimitStore.delete(k);
      }
    }
  }

  // Get or create rate limit entry
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    // Create new entry or reset expired one
    entry = {
      count: 1,
      resetAt: now + windowMs
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetAt: new Date(entry.resetAt)
    };
  }

  // Increment request count
  entry.count++;

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(entry.resetAt)
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetAt: new Date(entry.resetAt)
  };
}
