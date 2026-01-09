# Restaurant Picker

A web-based restaurant selection application utilizing a randomized spinning wheel interface. This application provides a practical solution for group decision-making when selecting dining options.

## 📚 Documentation

- **[QUICKSTART.md](QUICKSTART.md)** - Get started in 5 minutes (new users start here!)
- **[README.md](README.md)** - Complete documentation (you are here)
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Development guidelines and how to contribute
- **[CHANGELOG.md](CHANGELOG.md)** - Version history and updates
- **[IMPLEMENTATION_GUIDE.md](IMPLEMENTATION_GUIDE.md)** - Adding new features to the app
- **[openapi.yaml](openapi.yaml)** - API documentation (view at [editor.swagger.io](https://editor.swagger.io))

## Overview

This is a single-page application built for Cloudflare Pages with serverless functions. The application stores restaurant data in a GitHub repository and provides both public-facing selection functionality and password-protected administrative controls.

## Core Features

- **Randomized Selection Interface**: Canvas-based spinning wheel for restaurant selection
- **Service Type Wheel**: Fun mini-wheel to randomly pick between takeout, delivery, dine-in, or cooking at home
- **Dining Profiles**: Configure custom restaurant subsets for different scenarios with autocomplete selector
- **URL-Based Profile Routing**: Direct access to specific profiles via URL paths (e.g., `yoursite.com/quick-lunch`)
- **Service Type Filtering**: Dropdown selector for takeout, delivery, dine-in, or at-home options
- **At-Home Cooking Option**: Include recipes and dishes you can make at home alongside restaurant choices
- **Cuisine Filtering**: Dynamic checkbox filters for food type categories
- **Authentication System**: Token-based authentication for administrative functions
- **Data Management**: CRUD operations for restaurant and profile entries via admin panel
- **GitHub Integration**: Restaurant and profile data persisted in repository as JSON
- **Cloudflare Functions**: Serverless API endpoints for data operations
- **Static Deployment Mode**: Optional deployment without Cloudflare Functions for simpler hosting

## Deployment Information

Upon deployment to Cloudflare Pages, the application will be accessible at your assigned pages.dev domain or custom domain if configured.

### URL-Based Profile Access

The application supports direct profile access via URL paths, making it easy to share specific profiles:

- **Base URL** (`/`): Shows all restaurants (default view)
- **Profile URLs** (`/profile-id`): Automatically loads the specified profile

**Examples:**
- `yoursite.com/` - All restaurants
- `yoursite.com/quick-lunch` - Quick Lunch profile
- `yoursite.com/date-night` - Date Night profile
- `yoursite.com/vegetarian-options` - Great Vegetarian Options profile

**Features:**
- URLs are automatically updated when you select a different profile
- Browser back/forward buttons work correctly
- Shareable links maintain profile selection
- Page title updates to show the active profile
- Invalid profile IDs gracefully fall back to "all restaurants"

**Usage:** After creating a profile (e.g., "Work Food" with ID `work`), users can access it directly at `yoursite.com/work`. This is especially useful for bookmarking frequently used profiles or sharing specific restaurant subsets with others.

## Setup Instructions

### 1. Prerequisites

- GitHub account with repository access
- Cloudflare account (free tier sufficient)
- GitHub Personal Access Token with appropriate permissions

### 2. GitHub Personal Access Token Generation

**Option A: Fine-grained Personal Access Token (Recommended)**

1. Navigate to: https://github.com/settings/personal-access-tokens/new
2. Configure token settings:
   - **Token name**: Restaurant Picker App (or your preferred name)
   - **Expiration**: Choose appropriate expiration period
   - **Repository access**: Select "Only select repositories" and choose your restaurant data repository
   - **Repository permissions**:
     - Contents: **Read and write** (required for reading and updating restaurants.json)
3. Generate token and securely store the value
4. Note: Token values are only displayed once at creation time

**Option B: Classic Personal Access Token**

1. Navigate to: https://github.com/settings/tokens/new
2. Configure token settings:
   - **Note**: Restaurant Picker App (or your preferred name)
   - **Expiration**: Choose appropriate expiration period
   - **Select scopes**:
     - ✓ **repo** (Full control of private repositories - grants access to Contents API)
3. Generate token and securely store the value
4. Note: Token values are only displayed once at creation time

### 3. Cloudflare Pages Deployment

#### Option A: Dashboard Deployment (Recommended)

**Repository Connection**

1. Access Cloudflare Dashboard at https://dash.cloudflare.com
2. Navigate to Workers & Pages section
3. Select "Create application" → "Pages" → "Connect to Git"
4. Authorize and select the target repository

**Build Configuration**

- Framework preset: `None`
- Build command: `cd functions && npm install`
- Build output directory: `/`
- Root directory: `/`

**Environment Variables Configuration**

Navigate to Settings → Environment variables and configure the following:

| Variable         | Value                 | Description                                                         |
| ---------------- | --------------------- | ------------------------------------------------------------------- |
| `ADMIN_PASSWORD` | User-defined string   | Authentication credential for admin panel access                    |
| `JWT_SECRET`     | Random string (32+ chars) | Secret key for signing JWT tokens (generate using secure random method) |
| `GITHUB_TOKEN`   | GitHub PAT            | Personal access token for repository API operations                 |
| `GITHUB_REPO`    | `username/repository` | Target repository in owner/name format                              |
| `GITHUB_BRANCH`  | Branch name           | Target branch for data persistence (e.g., "main" or feature branch) |

Ensure all variables are marked as encrypted for security purposes.

**Generating JWT_SECRET**: Use a cryptographically secure random string of at least 32 characters. Example generation methods:
- Node.js: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- OpenSSL: `openssl rand -hex 32`
- Online: Use a reputable password generator with 32+ character length

**Deployment Execution**

1. Save configuration changes
2. Initiate deployment
3. Monitor build logs for successful completion
4. Application will be available at assigned pages.dev subdomain

#### Option B: CLI Deployment via Wrangler

```bash
# Install Wrangler globally
npm install -g wrangler

# Authenticate with Cloudflare
wrangler login

# Deploy to Pages
wrangler pages deploy . --project-name=restaurant-picker

# Configure environment secrets
wrangler pages secret put ADMIN_PASSWORD
wrangler pages secret put JWT_SECRET
wrangler pages secret put GITHUB_TOKEN
wrangler pages secret put GITHUB_REPO
wrangler pages secret put GITHUB_BRANCH
```

### 4. Post-Deployment Configuration

The application is configured to serve from `index.html` in the repository root. This has been pre-configured in the current repository structure. No additional routing configuration is required for standard deployments.

### 5. Alternative: Static-Only Deployment

For simpler deployments without Cloudflare Functions, you can deploy the application as a static site. In this mode:

- **Data Loading**: The application loads data directly from `restaurants.json` instead of API endpoints
- **Read-Only Mode**: Admin panel is automatically hidden (no write operations available)
- **Manual Updates**: Restaurant data must be updated by editing `restaurants.json` directly in GitHub
- **Simpler Hosting**: Can be deployed to any static hosting service (GitHub Pages, Netlify, Vercel, etc.)

#### Static Deployment Steps

**Option A: GitHub Pages**

1. Push `index.html` and `restaurants.json` to your repository
2. Go to repository Settings → Pages
3. Select source branch (e.g., `main`)
4. Select root folder `/`
5. Save and wait for deployment
6. Access at `https://username.github.io/repository-name/`

**Option B: Netlify**

1. Connect your GitHub repository to Netlify
2. Configure build settings:
   - Build command: (leave empty)
   - Publish directory: `/`
3. Deploy the site
4. Access at your assigned Netlify subdomain or custom domain

**Option C: Vercel**

1. Import your GitHub repository in Vercel
2. Configure project settings:
   - Framework Preset: Other
   - Build Command: (leave empty)
   - Output Directory: `/`
3. Deploy the project
4. Access at your assigned Vercel subdomain or custom domain

#### Updating Restaurant Data in Static Mode

To add, edit, or remove restaurants:

1. Navigate to your repository on GitHub
2. Click on `restaurants.json`
3. Click the pencil icon to edit
4. Make your changes following the data schema (see Data Schema section)
5. Commit changes with a descriptive message
6. Changes will be reflected on your site after deployment completes (usually within minutes)

**Advantages of Static Mode:**
- Simpler setup (no environment variables or API configuration)
- Works with any static hosting service
- No serverless function overhead
- Completely free hosting options available

**Limitations of Static Mode:**
- No admin panel (all updates must be done via GitHub)
- Manual JSON editing required
- No built-in authentication system
- Potential for JSON syntax errors when editing manually

**Recommendation:** Use Cloudflare Functions deployment for team environments where multiple people need to manage restaurants. Use static deployment for personal use or simple setups where you're comfortable editing JSON files directly.

## Usage

### End-User Operations

1. Access the deployed application URL
2. Configure filters in the sidebar:
   - **Service Type**: Select "All Service Types", "Takeout", "Delivery", "Dine In", or "At Home" from dropdown, or click the wheel icon (🎡) to randomly spin for a service type
   - **Dining Profile**: Type to search and select a profile like "With Sarah", "Quick Lunch Options", or "All Restaurants" using the autocomplete field
   - **Food Type Filters**: Check cuisine categories to narrow results (optional)
3. Activate the randomization mechanism via the "Spin to Select" button
4. View selected restaurant details including:
   - Name and cuisine types
   - Ordering instructions (phone, app, website)
   - Menu link (if available)
   - Contact information (address and phone)
   - Special notes

**Filter Behavior**:

- **Service Type**: Defaults to "All Service Types" showing restaurants regardless of service method. Select a specific type to filter restaurants offering that service.
- **Dining Profiles**: Profiles allow you to create custom restaurant subsets for specific scenarios. For example, if dining with someone who travels from a different location, create a profile with restaurants along their route. The "All Restaurants" profile includes all available options.
- **Food Type Filters**: Multiple food types can be selected simultaneously. Restaurants matching any selected cuisine will be included.

### Administrative Operations

1. Access admin panel via "Admin Login" button in sidebar
2. Authenticate using the configured `ADMIN_PASSWORD` value
3. Available administrative functions:

   **Restaurant Management:**
   - **Add Restaurant**: Create new restaurant entries with the following fields:
     - Required: name, food types, service types
     - Optional: dining profiles (checkboxes), ordering instructions, menu link, address, phone, notes
   - **Remove Restaurant**: Delete existing entries from the data store

   **Profile Management:**
   - **Add Profile**: Create profile labels (just name required). After creation, profiles can be assigned to restaurants via the restaurant form
   - **Remove Profile**: Delete existing profiles (default "All Restaurants" profile cannot be deleted)

   **Workflow**: Create profiles first using simple names, then tag restaurants with appropriate profiles when adding or editing them. The profile list shows which restaurants are currently tagged with each profile.

4. Administrative session can be terminated via logout function

## Application Structure

```
.
├── index.html                      # Single-page application (client-side)
├── restaurants.json                # Restaurant and profile data store
├── functions/
│   └── api/
│       ├── auth.js                # Authentication endpoint
│       ├── restaurants.js         # Restaurant CRUD operations (GET/POST)
│       ├── restaurants/
│       │   └── [id].js            # Individual restaurant operations (DELETE)
│       ├── profiles.js            # Profile CRUD operations (GET/POST)
│       └── profiles/
│           └── [id].js            # Individual profile operations (DELETE)
└── README.md                      # Documentation
```

## Data Schema

### Restaurant Object Structure

The `restaurants.json` file maintains an array of restaurant objects with the following schema:

```json
{
  "restaurants": [
    {
      "id": 1,
      "name": "Mario's Italian Bistro",
      "foodTypes": ["Italian", "Pizza"],
      "serviceTypes": ["takeout", "delivery", "dine-in"],
      "profiles": ["sarah-enroute", "quick-lunch"],
      "orderMethod": "Call or DoorDash",
      "menuLink": "https://marios-bistro.example.com/menu",
      "address": "123 Main St",
      "phone": "(555) 123-4567",
      "notes": "Excellent for large groups"
    }
  ]
}
```

#### Restaurant Field Specifications

| Field          | Type          | Required | Description                                                                         |
| -------------- | ------------- | -------- | ----------------------------------------------------------------------------------- |
| `id`           | Integer       | Yes      | Unique identifier, auto-incremented on creation                                     |
| `name`         | String        | Yes      | Restaurant business name                                                            |
| `foodTypes`    | Array[String] | Yes      | Cuisine categories for filtering                                                    |
| `serviceTypes` | Array[String] | Yes      | Available service options: "takeout", "delivery", "dine-in", "at-home"              |
| `profiles`     | Array[String] | No       | Profile IDs this restaurant is tagged with (empty array means no specific profiles) |
| `orderMethod`  | String        | No       | Instructions for ordering (e.g., "DoorDash", "call ahead", "online")                |
| `menuLink`     | String        | No       | URL to the restaurant's menu                                                        |
| `address`      | String        | No       | Physical location address                                                           |
| `phone`        | String        | No       | Contact telephone number                                                            |
| `notes`        | String        | No       | Additional information about the restaurant                                         |

### Profile Object Structure

The `restaurants.json` file also maintains an array of dining profile objects. Profiles are lightweight labels that restaurants can be tagged with:

```json
{
  "profiles": [
    {
      "id": "all",
      "name": "All Restaurants"
    },
    {
      "id": "sarah-enroute",
      "name": "With Sarah (En Route)"
    },
    {
      "id": "quick-lunch",
      "name": "Quick Lunch Options"
    }
  ]
}
```

#### Profile Field Specifications

| Field  | Type   | Required | Description                                                            |
| ------ | ------ | -------- | ---------------------------------------------------------------------- |
| `id`   | String | Yes      | Unique identifier, generated from profile name (lowercase, hyphenated) |
| `name` | String | Yes      | Display name for the dining profile                                    |

**Data Model**: Profiles are assigned to restaurants via the `profiles` array in each restaurant object, rather than profiles containing restaurant IDs. This restaurant-centric approach makes data management more intuitive and easier to maintain.

**Special Profile**: The "all" profile is a reserved profile ID that shows all restaurants regardless of their profile tags. This profile cannot be deleted.

### Complete restaurants.json Template

For manual data management, use this template to create or edit your `restaurants.json` file:

```json
{
  "profiles": [
    {
      "id": "all",
      "name": "All Restaurants"
    },
    {
      "id": "date-night",
      "name": "Date Night Options"
    },
    {
      "id": "quick-lunch",
      "name": "Quick Lunch"
    }
  ],
  "restaurants": [
    {
      "id": 1,
      "name": "Example Restaurant",
      "foodTypes": ["Italian", "Pizza"],
      "serviceTypes": ["takeout", "delivery", "dine-in"],
      "profiles": ["date-night"],
      "orderMethod": "Call (555) 123-4567 or order via DoorDash",
      "menuLink": "https://example.com/menu",
      "address": "123 Main Street, City, ST 12345",
      "phone": "(555) 123-4567",
      "notes": "Great for vegetarians. Reservations recommended on weekends."
    },
    {
      "id": 2,
      "name": "Another Restaurant",
      "foodTypes": ["Mexican", "Latin"],
      "serviceTypes": ["takeout", "delivery"],
      "profiles": ["quick-lunch", "date-night"],
      "orderMethod": "Uber Eats or Grubhub",
      "menuLink": "https://example2.com/menu",
      "address": "456 Oak Avenue, City, ST 12345",
      "phone": "(555) 987-6543",
      "notes": "Very quick service, usually ready in 10-15 minutes."
    }
  ]
}
```

**Important Notes:**

- Always include the "all" profile in your profiles array
- Restaurant IDs must be unique integers
- Profile IDs must use lowercase letters, numbers, and hyphens only
- Service types must be exactly: "takeout", "delivery", "dine-in", or "at-home"
- The `profiles` array can be empty (`[]`) if the restaurant isn't tagged with any specific profiles
- Optional fields (`orderMethod`, `menuLink`, `address`, `phone`, `notes`) can be omitted or left as empty strings
- Use "at-home" service type for recipes and dishes you can cook at home

## Security Considerations

### Current Implementation

The application implements multiple security layers to protect data and prevent unauthorized access:

**Authentication and Authorization:**

- Administrative credentials stored as encrypted environment variables in Cloudflare
- JWT (JSON Web Token) authentication with HMAC-SHA256 signing
- Tokens expire after 1 hour for enhanced security
- Rate limiting on authentication endpoint (5 attempts per minute)
- GitHub API token stored as encrypted secret
- Authentication required for all write operations (POST, PUT, DELETE)

**Input Validation and Sanitization:**

- Server-side validation of all incoming data
- Type checking for arrays and required fields
- Service type validation against allowed values (takeout, delivery, dine-in, at-home)
- Profile ID format validation (lowercase, alphanumeric, hyphens only)
- Reserved keyword protection for profile IDs
- Client-side HTML sanitization to prevent XSS attacks
- URL validation for menu links

**Data Integrity:**

- Cascade cleanup when profiles are deleted (removes profile references from restaurants)
- SHA-based conflict detection for GitHub commits
- Array existence checks before modification operations

**Network Security:**

- CORS headers configured for cross-origin resource sharing
- **IMPORTANT: HTTPS Required** - All production deployments must use HTTPS to protect credentials in transit

### Production Recommendations

For enterprise or high-security deployments, consider implementing:

- JWT (JSON Web Tokens) with expiration for stateless authentication
- OAuth 2.0 integration for identity management
- Rate limiting on API endpoints to prevent brute force attacks
- Audit logging for administrative actions
- Multi-factor authentication for admin access
- Content Security Policy (CSP) headers
- Regular security audits and dependency updates

## Customization Guide

### Visual Styling Modifications

**Color Scheme**

- Primary gradient colors defined in CSS: `#667eea` and `#764ba2`
- Wheel segment colors configured in JavaScript `CONFIG.WHEEL_COLORS` array
- Modify these values in `index.html` for brand consistency

**Wheel Behavior Configuration**

All wheel behavior parameters are centralized in the `CONFIG` constant at the top of the JavaScript section in `index.html`:

- `WHEEL_COLORS`: Array of hex color codes for wheel segments
- `MIN_SPINS`: Minimum rotation cycles (default: 5)
- `MAX_SPINS`: Maximum rotation cycles (default: 8)
- `SPIN_DURATION`: Animation length in milliseconds (default: 4000)
- `CACHE_MAX_AGE`: API response cache duration in seconds (default: 60)

**Layout Dimensions**

- Canvas dimensions: Controlled via `.wheel-container` CSS class
- Responsive breakpoint: 768px (configured in media queries)

### Data Model Extension

To add additional fields to restaurant records:

1. Update the JSON schema in `restaurants.json`
2. Add corresponding form inputs in the admin panel section
3. Modify `addRestaurant()` function to capture new field values
4. Update the result display template to show new fields

## Troubleshooting

### Data Loading Issues

**Symptom**: Restaurant data fails to load or displays empty state

**Resolution Steps**:

1. Verify `restaurants.json` exists in the repository root
2. Confirm GitHub token has correct permissions:
   - Fine-grained: "Contents" repository permission with Read and Write access
   - Classic: "repo" scope enabled
   - Direct links: https://github.com/settings/personal-access-tokens or https://github.com/settings/tokens
3. Review Cloudflare Functions logs for API errors
4. Validate JSON syntax in data file
5. Check network tab for failed API requests

### Authentication Failures

**Symptom**: Admin login rejected or returns unauthorized error

**Resolution Steps**:

1. Verify `ADMIN_PASSWORD` environment variable is configured
2. Confirm password is case-sensitive and matches exactly
3. Check browser developer console for authentication errors
4. Clear browser cache and retry authentication
5. Verify Cloudflare environment variable is deployed (not just saved)

### Data Persistence Failures

**Symptom**: Restaurant additions or deletions not saving

**Resolution Steps**:

1. Confirm `GITHUB_TOKEN` has write permissions for target repository
2. Validate `GITHUB_REPO` format follows "username/repository" pattern
3. Verify `GITHUB_BRANCH` matches the actual branch name in repository
4. Check GitHub API rate limits have not been exceeded
5. Review Cloudflare Functions logs for GitHub API errors

### Input Validation Errors

**Symptom**: Receiving "Invalid service types" or "Profile ID format" errors when adding data

**Explanation**: The application enforces strict validation rules to maintain data integrity

**Common Validation Rules**:

- Service types must be one of: `takeout`, `delivery`, `dine-in`, or `at-home`
- Profile IDs must contain only lowercase letters, numbers, and hyphens
- Food types and service types must be provided as arrays
- Reserved profile IDs (e.g., "all") cannot be used for custom profiles
- Restaurant names, food types, and service types are required fields

**Resolution**: Ensure submitted data conforms to the validation rules. Check browser console for specific error messages.

## Local Development

### Development Environment Setup

```bash
# Install Wrangler CLI
npm install -g wrangler

# Configure local environment variables
cat > .dev.vars << EOF
ADMIN_PASSWORD=your_password
GITHUB_TOKEN=your_github_token
GITHUB_REPO=username/repo
GITHUB_BRANCH=main
EOF

# Start local development server
wrangler pages dev . --local
```

Access the application at `http://localhost:8788/`

Note: Local development requires Node.js and npm to be installed.

## API Endpoints

### Authentication

- **POST** `/api/auth` - Authenticate and receive session token

### Restaurant Operations

- **GET** `/api/restaurants` - Retrieve all restaurant data
- **POST** `/api/restaurants` - Create new restaurant (requires auth)
- **DELETE** `/api/restaurants/:id` - Remove restaurant by ID (requires auth)

### Profile Operations

- **GET** `/api/profiles` - Retrieve all dining profile data
- **POST** `/api/profiles` - Create new dining profile (requires auth)
- **DELETE** `/api/profiles/:id` - Remove profile by ID (requires auth)

All API endpoints return JSON responses and include appropriate CORS headers.

## Technical Notes

### Architecture and Technology Stack

- Built for Cloudflare Pages with Functions (v2)
- Client-side rendering using vanilla JavaScript (no framework dependencies)
- HTML5 Canvas API for wheel visualization and animations
- GitHub Contents API for serverless data persistence
- No build process, bundlers, or package dependencies required

### Code Quality and Best Practices

The codebase implements several software engineering best practices:

**Security:**

- Input validation and sanitization at both client and server layers
- XSS prevention through HTML escaping
- CORS configuration for cross-origin requests
- Secure token-based authentication

**Code Organization:**

- Configuration constants centralized in `CONFIG` object
- Modular function design with single responsibilities
- JSDoc-style documentation for functions
- Descriptive variable and function naming conventions

**Error Handling:**

- Try-catch blocks for all async operations
- Graceful fallbacks when API calls fail
- User-friendly error messages
- Validation errors with specific feedback

**Data Integrity:**

- SHA-based conflict detection for concurrent modifications
- Cascade cleanup for referential integrity
- Type validation for all data structures
- Array existence checks before modifications

**Performance:**

- Request animation frame for smooth wheel animations
- Easing functions for natural motion
- Response caching with configurable TTL
- Minimal DOM manipulations
