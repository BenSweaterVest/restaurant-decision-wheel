/**
 * Restaurant Data Management API
 *
 * Provides CRUD operations for restaurant data with GitHub-based persistence.
 *
 * Endpoints:
 * - GET  /api/restaurants     - Retrieve all restaurant records (public)
 * - POST /api/restaurants     - Create new restaurant record (authenticated)
 * - PUT  /api/restaurants     - Update existing restaurant record (authenticated)
 *
 * Data Storage:
 * Utilizes GitHub Contents API for persistent storage in repository JSON file.
 * All modifications are committed directly to the configured branch.
 *
 * Environment Variables:
 * - GITHUB_TOKEN: Personal access token with repo scope
 * - GITHUB_REPO: Target repository in "owner/repository" format
 * - GITHUB_BRANCH: Target branch for commits
 * - ADMIN_PASSWORD: Administrative credential for write operations
 *
 * Authentication:
 * Write operations require Bearer token obtained from /api/auth endpoint.
 */

import {
  verifyAuth,
  fetchFromGitHub,
  updateGitHub,
  getCorsHeaders,
  errorResponse,
  successResponse,
  generateUUID,
  validateRestaurantData
} from './_shared.js';

/**
 * GET Request Handler
 * Retrieves all restaurant records from GitHub storage
 * @param {Object} context - Cloudflare Pages Functions context
 * @returns {Response} - JSON response with restaurant data
 */
export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { data } = await fetchFromGitHub(env);

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(env),
        'Cache-Control': 'public, max-age=60'
      }
    });
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return errorResponse('Failed to fetch restaurants', 500, env);
  }
}

/**
 * POST Request Handler
 * Creates new restaurant record with authentication validation
 * @param {Object} context - Cloudflare Pages Functions context
 * @returns {Response} - JSON response with operation result
 */
export async function onRequestPost(context) {
  const { request, env } = context;

  // Verify authentication
  if (!(await verifyAuth(request, env))) {
    return errorResponse('Unauthorized', 401, env);
  }

  try {
    const newRestaurant = await request.json();

    // Validate restaurant data
    const validation = validateRestaurantData(newRestaurant);
    if (!validation.valid) {
      return errorResponse(validation.errors.join(', '), 400, env);
    }

    // Retrieve current data and file SHA
    const { data, sha } = await fetchFromGitHub(env);

    // Ensure restaurants array exists
    if (!data.restaurants) {
      data.restaurants = [];
    }

    // Generate UUID for new restaurant if not provided
    if (!newRestaurant.id) {
      newRestaurant.id = generateUUID();
    }

    // Append new restaurant to existing data
    data.restaurants.push(newRestaurant);

    // Commit changes to repository
    await updateGitHub(env, data, sha, `Add restaurant: ${newRestaurant.name}`);

    return successResponse(
      {
        success: true,
        restaurant: newRestaurant
      },
      env
    );
  } catch (error) {
    console.error('Error adding restaurant:', error);
    return errorResponse(`Failed to add restaurant: ${error.message}`, 500, env);
  }
}

/**
 * PUT Request Handler
 * Updates existing restaurant record with authentication validation
 * @param {Object} context - Cloudflare Pages Functions context
 * @returns {Response} - JSON response with operation result
 */
export async function onRequestPut(context) {
  const { request, env } = context;

  // Verify authentication
  if (!(await verifyAuth(request, env))) {
    return errorResponse('Unauthorized', 401, env);
  }

  try {
    const updatedRestaurant = await request.json();

    // Validate restaurant data
    const validation = validateRestaurantData(updatedRestaurant);
    if (!validation.valid) {
      return errorResponse(validation.errors.join(', '), 400, env);
    }

    if (!updatedRestaurant.id) {
      return errorResponse('Restaurant ID is required for updates', 400, env);
    }

    // Retrieve current data and file SHA
    const { data, sha } = await fetchFromGitHub(env);

    // Find restaurant by ID
    const index = data.restaurants.findIndex((r) => r.id === updatedRestaurant.id);

    if (index === -1) {
      return errorResponse('Restaurant not found', 404, env);
    }

    // Update restaurant
    data.restaurants[index] = updatedRestaurant;

    // Commit changes to repository
    await updateGitHub(env, data, sha, `Update restaurant: ${updatedRestaurant.name}`);

    return successResponse(
      {
        success: true,
        restaurant: updatedRestaurant
      },
      env
    );
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return errorResponse(`Failed to update restaurant: ${error.message}`, 500, env);
  }
}

/**
 * OPTIONS Request Handler
 * Responds to CORS preflight requests
 * @returns {Response} - CORS headers response
 */
export async function onRequestOptions(context) {
  return new Response(null, {
    headers: getCorsHeaders(context.env)
  });
}
