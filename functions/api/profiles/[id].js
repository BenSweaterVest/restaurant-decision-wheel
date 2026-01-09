/**
 * Profile Deletion API Endpoint
 *
 * Handles removal of individual profile records by ID.
 * Includes cascade cleanup to remove profile references from all restaurants.
 *
 * Endpoint: DELETE /api/profiles/:id
 *
 * Path Parameters:
 * - id: String profile identifier
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
 * Removes profile record by ID with authentication validation
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
    const profileId = params.id;

    // Prevent deletion of "all" profile
    if (profileId === 'all') {
      return errorResponse('Cannot delete the default "All Restaurants" profile', 400, env);
    }

    // Retrieve current data and file SHA
    const { data, sha } = await fetchFromGitHub(env);

    if (!data.profiles) {
      return errorResponse('No profiles found', 404, env);
    }

    // Locate profile record by ID
    const index = data.profiles.findIndex((p) => p.id === profileId);

    if (index === -1) {
      return errorResponse('Profile not found', 404, env);
    }

    const deletedProfile = data.profiles[index];
    data.profiles.splice(index, 1);

    // Clean up profile references in restaurants (cascade cleanup)
    if (data.restaurants) {
      data.restaurants.forEach((restaurant) => {
        if (restaurant.profiles && Array.isArray(restaurant.profiles)) {
          restaurant.profiles = restaurant.profiles.filter((p) => p !== profileId);
        }
      });
    }

    // Commit changes to repository
    await updateGitHub(env, data, sha, `Delete profile: ${deletedProfile.name}`);

    return successResponse(
      {
        success: true,
        deleted: deletedProfile
      },
      env
    );
  } catch (error) {
    console.error('Error deleting profile:', error);
    return errorResponse(`Failed to delete profile: ${error.message}`, 500, env);
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
