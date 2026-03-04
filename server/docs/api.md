# Garden Planner API - Full Snapshot Versioning

## Overview

The API has been updated to support the new normalized data model with full snapshot versioning.

## Data Model

```
Garden
  ↓
SeasonPlan (year-specific)
  ↓
Version (full snapshot: layout + plantings)
```

## Authentication

All endpoints require authentication via JWT token in cookies (set by OAuth login).

---

## API Endpoints

### Gardens

#### GET /api/gardens

Get all gardens for authenticated user.

**Response:**

```json
[
  {
    "_id": "...",
    "title": "My Backyard",
    "members": [
      {
        "userId": "...",
        "role": "owner"
      }
    ],
    "createdAt": "2026-03-03T..."
  }
]
```

#### POST /api/gardens

Create a new garden.

**Request:**

```json
{
  "title": "My Garden"
}
```

**Response:** 201 Created

```json
{
  "_id": "...",
  "title": "My Garden",
  "members": [...],
  "createdAt": "..."
}
```

#### GET /api/gardens/:id

Get a specific garden.

#### PUT /api/gardens/:id

Update garden (owner only).

**Request:**

```json
{
  "title": "Updated Name"
}
```

#### DELETE /api/gardens/:id

Delete garden and all related season plans and versions (owner only).

---

### Season Plans

#### GET /api/gardens/:gardenId/season-plans

Get all season plans for a garden.

**Response:**

```json
[
  {
    "_id": "...",
    "gardenId": "...",
    "year": 2026,
    "currentVersionId": "...",
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

#### POST /api/gardens/season-plans

Create a new season plan.

**Request:**

```json
{
  "gardenId": "...",
  "year": 2026,
  "layout": {
    "shapes": {
      "shape1": { "type": "rect", "x": 0, "y": 0, "width": 100, "height": 50 }
    }
  },
  "plantings": {
    "shape1": { "crop": "Tomatoes", "variety": "Cherry" }
  }
}
```

**Response:** 201 Created

```json
{
  "_id": "...",
  "gardenId": "...",
  "year": 2026,
  "layout": { ... },
  "plantings": { ... },
  "currentVersionId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Note:** Layout and plantings are returned for convenience but are actually stored in the Version.

#### GET /api/gardens/season-plans/:id

Get a specific season plan with current version data.

**Response:**

```json
{
  "_id": "...",
  "gardenId": "...",
  "year": 2026,
  "layout": { ... },      // From current version
  "plantings": { ... },   // From current version
  "currentVersionId": "...",
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### PUT /api/gardens/season-plans/:id

Update a season plan.

Creates a new Version only if layout or plantings change.
Metadata updates (year) do not create a new Version.

**Request:**

```json
{
  "layout": {
    "shapes": {
      "shape1": { ... },
      "shape2": { ... }
    }
  },
  "plantings": {
    "shape1": { "crop": "Peppers" }
  },
  "comment": "Added new bed"
}
```

**Response:**

```json
{
  "_id": "...",
  "gardenId": "...",
  "year": 2026,
  "layout": { ... },      // New version data
  "plantings": { ... },   // New version data
  "currentVersionId": "...", // New version ID
  "createdAt": "...",
  "updatedAt": "..."
}
```

**Important:**

- Creates a new Version with full snapshot
- Updates SeasonPlan's currentVersionId
- All previous versions are preserved

#### DELETE /api/gardens/season-plans/:id

Delete season plan and all its versions (owner only).

---

### Versions

#### GET /api/gardens/season-plans/:seasonPlanId/versions

Get version history for a season plan.

**Response:**

```json
[
  {
    "_id": "...",
    "comment": "Added new bed",
    "type": "manual",
    "createdAt": "2026-03-03T14:30:00Z"
  },
  {
    "_id": "...",
    "comment": "Initial version",
    "type": "manual",
    "createdAt": "2026-03-03T10:00:00Z"
  }
]
```

#### GET /api/gardens/versions/:id

Get a specific version (full snapshot).

**Response:**

```json
{
  "_id": "...",
  "seasonPlanId": "...",
  "layout": {
    "shapes": { ... }
  },
  "plantings": {
    "shape1": { "crop": "Tomatoes" }
  },
  "comment": "Initial version",
  "type": "manual",
  "createdAt": "..."
}
```

#### POST /api/gardens/versions/:id/restore

Restore a specific version (make it current).

**Response:**

```json
{
  "message": "Version restored",
  "version": {
    "_id": "...",  // New version ID
    "seasonPlanId": "...",
    "layout": { ... },
    "plantings": { ... },
    "comment": "Restored from version ...",
    "type": "manual",
    "createdAt": "..."
  }
}
```

---

## Legacy Endpoints

The old `/api/plans` endpoints are deprecated and will be removed after migration.

---

## Full Snapshot Versioning

### Key Concepts

1. **SeasonPlan** - Metadata only (garden, year, current version reference)
2. **Version** - Complete snapshot (layout + plantings + metadata)
3. **Version History** - All previous states are preserved

### How It Works

#### Creating a Plan

```javascript
POST /api/gardens/season-plans
{
  gardenId: "...",
  year: 2026,
  layout: { shapes: {...} },
  plantings: { bed1: {...} }
}

// Creates:
// 1. SeasonPlan with gardenId, year
// 2. Version with layout + plantings (full snapshot)
// 3. Links SeasonPlan.currentVersionId → Version
```

#### Updating a Plan

```javascript
PUT /api/gardens/season-plans/:id
{
  layout: { shapes: {...} },  // Updated layout
  plantings: { bed1: {...} }, // Updated plantings
  comment: "Added new bed"
}

// Creates:
// 1. NEW Version with full snapshot (layout + plantings)
// 2. Updates SeasonPlan.currentVersionId → New Version
// 3. Old version is preserved for history
```

#### Viewing History

```javascript
GET /api/gardens/season-plans/:id/versions

// Returns list of all versions
// Each has full snapshot (layout + plantings)
```

#### Restoring Old Version

```javascript
POST /api/gardens/versions/:oldVersionId/restore

// Creates:
// 1. NEW Version as copy of old version
// 2. Updates SeasonPlan.currentVersionId → New Version
// 3. Original old version unchanged
```

---

## Migration from Old API

### Old Structure (Plans)

```javascript
GET /api/plans/:id
// Returns: { userId, name, year, layout, plantings }
```

### New Structure (Gardens)

```javascript
// Step 1: Get or create garden
GET /api/gardens
// Or POST /api/gardens { title: "My Garden" }

// Step 2: Get season plan
GET /api/gardens/season-plans/:id
// Returns: { gardenId, year, layout, plantings, currentVersionId }
```

### Frontend Migration

**Old Code:**

```javascript
// Get plan
const plan = await fetch("/api/plans/123");
const { layout, plantings } = plan;

// Update plan
await fetch("/api/plans/123", {
  method: "PUT",
  body: JSON.stringify({ layout, plantings }),
});
```

**New Code:**

```javascript
// Get season plan
const seasonPlan = await fetch("/api/gardens/season-plans/123");
const { layout, plantings } = seasonPlan; // Same structure!

// Update season plan (creates new version)
await fetch("/api/gardens/season-plans/123", {
  method: "PUT",
  body: JSON.stringify({
    layout,
    plantings,
    comment: "Updated layout",
  }),
});

// NEW: View history
const versions = await fetch("/api/gardens/season-plans/123/versions");

// NEW: Restore old version
await fetch("/api/gardens/versions/456/restore", { method: "POST" });
```

---

## Response Formats

### Success Responses

**200 OK** - Resource retrieved successfully
**201 Created** - Resource created successfully
**204 No Content** - Action completed, no content to return

### Error Responses

**400 Bad Request**

```json
{ "message": "Garden title is required" }
```

**403 Forbidden**

```json
{ "message": "Access denied" }
```

**404 Not Found**

```json
{ "message": "Garden not found" }
```

**500 Internal Server Error**

```json
{ "message": "Server error" }
```

---

## Examples

### Complete Workflow

#### 1. Create a Garden

```bash
POST /api/gardens
{
  "title": "My Vegetable Garden"
}

# Response: { _id: "garden123", title: "...", ... }
```

#### 2. Create Season Plan for 2026

```bash
POST /api/gardens/season-plans
{
  "gardenId": "garden123",
  "year": 2026,
  "layout": {
    "shapes": {
      "bed1": { "type": "rect", "x": 0, "y": 0, "width": 200, "height": 100 }
    }
  },
  "plantings": {
    "bed1": { "crop": "Tomatoes", "variety": "Beefsteak" }
  }
}

# Response: { _id: "plan123", layout: {...}, plantings: {...}, currentVersionId: "v1" }
```

#### 3. Update Plantings (Creates Version 2)

```bash
PUT /api/gardens/season-plans/plan123
{
  "plantings": {
    "bed1": { "crop": "Tomatoes", "variety": "Cherry" }
  },
  "comment": "Switched to cherry tomatoes"
}

# Response: { ..., currentVersionId: "v2" }
```

#### 4. View Version History

```bash
GET /api/gardens/season-plans/plan123/versions

# Response: [
#   { _id: "v2", comment: "Switched to cherry tomatoes", createdAt: "..." },
#   { _id: "v1", comment: "Initial version", createdAt: "..." }
# ]
```

#### 5. Restore Version 1

```bash
POST /api/gardens/versions/v1/restore

# Response: { message: "Version restored", version: { _id: "v3", ... } }
# Note: Creates v3 as copy of v1, now currentVersionId = v3
```

---

## Notes

- All dates are in ISO 8601 format (UTC)
- All IDs are MongoDB ObjectIds
- Requires authentication for all endpoints
- Layout and plantings are JSON objects with flexible structure
- Version history is unlimited (consider archiving old versions in production)

---

**Updated:** March 3, 2026
**Version:** 2.0 (Full Snapshot Versioning)
