/**
 * Restaurant Deletion API Endpoint
 *
 * Handles removal of individual restaurant records by ID.
 *
 * Endpoint: DELETE /api/restaurants/:id
 *
 * Path Parameters:
 * - id: Restaurant identifier (UUID or integer)
 *
 * Authentication: Required (Bearer token)
 *
 * Environment Variables:
 * - GITHUB_TOKEN: Personal access token with repo scope
 * - GITHUB_REPO: Target repository in "owner/repository" format
 * - GITHUB_BRANCH: Target branch for commits
 * - ADMIN_PASSWORD: Administrative credential for verification
 */

import {
  verifyAuth,
  fetchFromGitHub,
  updateGitHub,
  getCorsHeaders,
  errorResponse,
  successResponse
} from '../_shared.js';

/**
 * DELETE Request Handler
 * Removes restaurant record by ID with authentication validation
 * @param {Object} context - Cloudflare Pages Functions context
 * @returns {Response} - JSON response with operation result
 */
export async function onRequestDelete(context) {
  const { request, env, params } = context;

  // Verify authentication
  if (!(await verifyAuth(request, env))) {
    return errorResponse('Unauthorized', 401, env);
  }

  try {
    const restaurantId = params.id;

    // Retrieve current data and file SHA
    const { data, sha } = await fetchFromGitHub(env);

    // Locate restaurant record by ID (support both string UUID and integer ID)
    const index = data.restaurants.findIndex((r) => String(r.id) === String(restaurantId));

    if (index === -1) {
      return errorResponse('Restaurant not found', 404, env);
    }

    const deletedRestaurant = data.restaurants[index];
    data.restaurants.splice(index, 1);

    // Commit changes to repository
    await updateGitHub(env, data, sha, `Delete restaurant: ${deletedRestaurant.name}`);

    return successResponse(
      {
        success: true,
        deleted: deletedRestaurant
      },
      env
    );
  } catch (error) {
    console.error('Error deleting restaurant:', error);
    return errorResponse(`Failed to delete restaurant: ${error.message}`, 500, env);
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
