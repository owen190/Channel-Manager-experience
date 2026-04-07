# API Endpoints Reference

## Timeline

### GET `/api/live/timeline`
Fetch chronological activity for an advisor.

**Query Parameters:**
- `advisorId` (required) - Advisor ID
- `offset` (optional, default: 0) - Pagination offset
- `limit` (optional, default: 30) - Items per page

**Response:**
```json
{
  "items": [
    {
      "id": "string",
      "type": "note|transcript|signal|deal_update|activity",
      "timestamp": "ISO8601",
      "title": "string",
      "description": "string (truncated)",
      "source": "string",
      "icon": "string"
    }
  ],
  "total": "number",
  "offset": "number",
  "limit": "number"
}
```

---

## Global Search

### GET `/api/live/search`
Search across all entities.

**Query Parameters:**
- `q` (required) - Search query, min 2 characters

**Response:**
```json
{
  "advisors": [{
    "id": "string",
    "type": "advisor",
    "title": "string (name)",
    "subtitle": "string",
    "description": "string"
  }],
  "deals": [...],
  "notes": [...],
  "transcripts": [...],
  "signals": [...],
  "total": "number"
}
```

---

## Notifications

### GET `/api/live/notifications`
Fetch notifications for a user.

**Query Parameters:**
- `userId` (required) - User ID
- `limit` (optional, default: 20) - Max results
- `readOnly` (optional) - Filter by read status

**Response:**
```json
{
  "notifications": [
    {
      "id": "string",
      "type": "friction_alert|deal_health_change|score_update|partner_activity|system",
      "title": "string",
      "message": "string",
      "read": "boolean",
      "createdAt": "ISO8601"
    }
  ],
  "unreadCount": "number"
}
```

### POST `/api/live/notifications`
Create a notification.

**Body:**
```json
{
  "userId": "string (optional)",
  "orgId": "string (optional)",
  "type": "string (required)",
  "title": "string (required)",
  "message": "string (required)",
  "entityType": "string (optional)",
  "entityId": "string (optional)"
}
```

**Response:** Created notification object

### PATCH `/api/live/notifications`
Mark notifications as read.

**Body (option 1 - specific IDs):**
```json
{
  "ids": ["id1", "id2", ...]
}
```

**Body (option 2 - all for user):**
```json
{
  "userId": "string",
  "all": true
}
```

**Response:**
```json
{
  "success": "boolean"
}
```

---

## Import/Export

### POST `/api/live/import`
Import advisors from CSV file.

**Content-Type:** `multipart/form-data`
**Form Fields:**
- `file` - CSV file with columns: name, title, company, location, tier, mrr, commPreference, personalIntel

**Response:**
```json
{
  "imported": "number",
  "errors": ["string"],
  "total": "number"
}
```

### GET `/api/live/export`
Export data as CSV or JSON.

**Query Parameters:**
- `type` (optional, default: "all") - "advisors" | "deals" | "all"
- `format` (optional, default: "csv") - "csv" | "json"

**Response:** File download with proper headers

---

## Helper Functions

### `lib/notifications.ts`

**`createNotification(params)`**
Creates a notification in the database.
```typescript
await createNotification({
  userId?: string;
  orgId?: string;
  type: string;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
})
```

**`generateFrictionAlerts()`**
Scans advisors for high/critical friction and creates notifications.
```typescript
const alerts = await generateFrictionAlerts()
```

**`generateDealAlerts()`**
Scans deals for health issues and creates notifications.
```typescript
const alerts = await generateDealAlerts()
```

**`generateMorningBriefing()`**
Creates a daily summary notification.
```typescript
const notif = await generateMorningBriefing()
```

**`notifyScoreUpdate(advisorId, oldScore, newScore)`**
Creates a score change notification.
```typescript
const notif = await notifyScoreUpdate('advisor-123', 45, 52)
```

---

## Error Responses

All endpoints return consistent error format:

```json
{
  "error": "string describing the error"
}
```

**HTTP Status Codes:**
- 200 - Success
- 201 - Created
- 400 - Bad request (missing params, validation error)
- 404 - Not found
- 500 - Server error
