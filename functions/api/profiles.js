/**
 * Profile Management API
 *
 * Provides CRUD operations for dining profile data with GitHub-based persistence.
 *
 * Endpoints:
 * - GET  /api/profiles     - Retrieve all profile records (public)
 * - POST /api/profiles     - Create new profile record (authenticated)
 * - PUT  /api/profiles     - Update existing profile record (authenticated)
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
  validateProfileId
} from './_shared.js';

/**
 * GET Request Handler
 * Retrieves all profile records from GitHub storage
 * @param {Object} context - Cloudflare Pages Functions context
 * @returns {Response} - JSON response with profile data
 */
export async function onRequestGet(context) {
  const { env } = context;

  try {
    const { data } = await fetchFromGitHub(env);

    return new Response(
      JSON.stringify({
        profiles: data.profiles || []
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(env),
          'Cache-Control': 'public, max-age=60'
        }
      }
    );
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return errorResponse('Failed to fetch profiles', 500, env);
  }
}

/**
 * POST Request Handler
 * Creates new profile record with authentication validation
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
    const newProfile = await request.json();

    // Validate required fields per data schema
    if (!newProfile.id || !newProfile.name) {
      return errorResponse('Missing required fields: id and name', 400, env);
    }

    // Validate profile ID format (lowercase, hyphenated)
    if (!validateProfileId(newProfile.id)) {
      return errorResponse(
        'Profile ID must contain only lowercase letters, numbers, and hyphens',
        400,
        env
      );
    }

    // Check for reserved profile IDs
    const reservedIds = ['all'];
    if (reservedIds.includes(newProfile.id)) {
      return errorResponse('Profile ID is reserved and cannot be used', 400, env);
    }

    // Retrieve current data and file SHA
    const { data, sha } = await fetchFromGitHub(env);

    // Ensure profiles array exists
    if (!data.profiles) {
      data.profiles = [{ id: 'all', name: 'All Restaurants' }];
    }

    // Check if profile with this ID already exists
    if (data.profiles.find((p) => p.id === newProfile.id)) {
      return errorResponse('Profile with this ID already exists', 400, env);
    }

    // Append new profile to existing data
    data.profiles.push(newProfile);

    // Commit changes to repository
    await updateGitHub(env, data, sha, `Add profile: ${newProfile.name}`);

    return successResponse(
      {
        success: true,
        profile: newProfile
      },
      env
    );
  } catch (error) {
    console.error('Error adding profile:', error);
    return errorResponse(`Failed to add profile: ${error.message}`, 500, env);
  }
}

/**
 * PUT Request Handler
 * Updates existing profile record with authentication validation
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
    const updatedProfile = await request.json();

    // Validate required fields
    if (!updatedProfile.id || !updatedProfile.name) {
      return errorResponse('Missing required fields: id and name', 400, env);
    }

    // Prevent editing "all" profile
    if (updatedProfile.id === 'all') {
      return errorResponse('Cannot edit the default "All Restaurants" profile', 400, env);
    }

    // Retrieve current data and file SHA
    const { data, sha } = await fetchFromGitHub(env);

    // Find profile by ID
    const index = data.profiles.findIndex((p) => p.id === updatedProfile.id);

    if (index === -1) {
      return errorResponse('Profile not found', 404, env);
    }

    // Update profile (only name can change, ID stays the same)
    data.profiles[index].name = updatedProfile.name;

    // Commit changes to repository
    await updateGitHub(env, data, sha, `Update profile: ${updatedProfile.name}`);

    return successResponse(
      {
        success: true,
        profile: data.profiles[index]
      },
      env
    );
  } catch (error) {
    console.error('Error updating profile:', error);
    return errorResponse(`Failed to update profile: ${error.message}`, 500, env);
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
