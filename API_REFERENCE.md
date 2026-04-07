# API Reference - New Endpoints

## Admin Routes

### Users Management
```
GET  /api/admin/users
     Returns list of all users with mock data
     Response: User[] (id, name, email, role, status, lastActive)

POST /api/admin/users
     Create or update a user
     Body: { id?, name, email, role, status }
     Response: User object

POST /api/admin/users/invite
     Send invitation to a new user
     Body: { email, role }
     Response: { success, message, inviteToken }
```

### Audit Logs
```
GET  /api/admin/audit-logs?dateRange=all&userId=all
     Get audit log entries with optional filtering
     Query params:
       - dateRange: 'all' | '7d' | '30d' | '90d'
       - userId: 'all' | specific user ID
     Response: AuditLog[]

POST /api/admin/audit-logs
     Create a new audit log entry
     Body: { userId?, action, entityType, entityId?, details? }
     Response: AuditLog object
```

---

## Integration Routes

### Integration CRUD
```
GET  /api/integrations
     Get all configured integrations
     Response: Integration[] (id, org_id, type, status, credentials, settings, last_sync)

POST /api/integrations
     Save or update integration configuration
     Body: { id?, orgId, type, status, credentials, settings }
     Response: Integration object

DELETE /api/integrations?id=<id>
       Delete an integration
       Query params: id (required)
       Response: { success: true }
```

### Salesforce Integration
```
GET  /api/integrations/salesforce?action=oauth-url
     Get OAuth authorization URL for Salesforce
     Response: { url, state }

POST /api/integrations/salesforce?action=callback
     Handle OAuth callback after user authorizes
     Body: { code, orgId }
     Response: { success, credentials: { accessToken, refreshToken, instanceUrl } }

POST /api/integrations/salesforce?action=sync
     Trigger sync of Salesforce contacts and opportunities
     Body: { orgId, credentials: { accessToken, instanceUrl } }
     Response: { success, syncedCount, lastSync }
```

### HubSpot Integration
```
GET  /api/integrations/hubspot?action=oauth-url
     Get OAuth authorization URL for HubSpot
     Response: { url, state }

POST /api/integrations/hubspot?action=callback
     Handle OAuth callback after user authorizes
     Body: { code, orgId }
     Response: { success, credentials: { accessToken, refreshToken, expiresIn } }

POST /api/integrations/hubspot?action=sync
     Trigger sync of HubSpot contacts and deals
     Body: { orgId, credentials: { accessToken } }
     Response: { success, syncedCount, lastSync }
```

### Slack Integration
```
GET  /api/integrations/slack?action=oauth-url
     Get OAuth authorization URL for Slack
     Response: { url, state }

POST /api/integrations/slack?action=callback
     Handle OAuth callback after user authorizes
     Body: { code }
     Response: { success, credentials: { accessToken, botUserId, webhookUrl, teamId } }

POST /api/integrations/slack?action=notify
     Send notification to Slack channel
     Body: { webhookUrl, message }
     Response: { success, message: "Notification sent to Slack" }
```

### Meeting Intelligence (Webhook Receiver)
```
POST /api/integrations/meeting-intel
     Receive meeting transcript from Gong or Fireflies
     Body: {
       webhookSource: 'gong' | 'fireflies',
       transcript: string,
       participants: Array<{ email?, name?, emailAddress?, fullName? }>,
       recordedAt?: string (ISO),
       metadata?: object
     }
     Response: {
       success: true,
       transcriptId,
       advisorId: string | null,
       message: "Transcript received and queued for analysis"
     }

     Status Codes:
       201 - Transcript received successfully
       400 - Missing required fields
       500 - Processing error
```

---

## Integration Types & Metadata

### Supported Integration Types
```typescript
'salesforce' | 'hubspot' | 'gmail' | 'google-calendar' | 'gong' | 'fireflies' | 'slack'
```

### Integration Metadata (from lib/integrations/index.ts)
```json
{
  "salesforce": {
    "name": "Salesforce",
    "description": "CRM integration for contact and opportunity sync",
    "icon": "Cloud",
    "category": "crm",
    "oauthEnabled": true,
    "webhookEnabled": true,
    "syncInterval": 60
  },
  "hubspot": {
    "name": "HubSpot",
    "description": "CRM and marketing automation platform",
    "icon": "Hexagon",
    "category": "crm",
    "oauthEnabled": true,
    "webhookEnabled": true,
    "syncInterval": 60
  },
  "slack": {
    "name": "Slack",
    "description": "Team messaging and notifications",
    "icon": "Hash",
    "category": "collaboration",
    "oauthEnabled": true,
    "webhookEnabled": true
  }
}
```

---

## Request/Response Examples

### Get Users
```bash
curl http://localhost:3000/api/admin/users

# Response
[
  {
    "id": "1",
    "name": "Jordan R.",
    "email": "jordan@example.com",
    "role": "admin",
    "status": "active",
    "lastActive": "2 minutes ago"
  }
]
```

### Invite User
```bash
curl -X POST http://localhost:3000/api/admin/users/invite \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "role": "manager"}'

# Response
{
  "success": true,
  "message": "Invitation sent to newuser@example.com",
  "inviteToken": "550e8400-e29b-41d4-a716-446655440000",
  "email": "newuser@example.com",
  "role": "manager"
}
```

### Get Integration OAuth URL
```bash
curl http://localhost:3000/api/integrations/salesforce?action=oauth-url

# Response
{
  "url": "https://login.salesforce.com/services/oauth2/authorize?client_id=...",
  "state": "550e8400-e29b-41d4-a716-446655440000"
}
```

### Send Meeting Transcript
```bash
curl -X POST http://localhost:3000/api/integrations/meeting-intel \
  -H "Content-Type: application/json" \
  -d '{
    "webhookSource": "gong",
    "transcript": "Customer: Can you walk us through the pricing? Sales: Absolutely...",
    "participants": [
      {"email": "customer@acme.com", "name": "John Smith"},
      {"email": "tom.bradley@channel.com", "name": "Tom Bradley"}
    ],
    "recordedAt": "2026-03-31T14:30:00Z"
  }'

# Response
{
  "success": true,
  "transcriptId": "550e8400-e29b-41d4-a716-446655440000",
  "advisorId": "advisor-123",
  "message": "Transcript received and queued for analysis"
}
```

---

## Error Responses

All endpoints return appropriate HTTP status codes:

```
200 OK              - Successful GET or POST returning existing resource
201 Created         - Successful POST creating new resource
400 Bad Request     - Missing or invalid required parameters
401 Unauthorized    - Authentication required (when implemented)
404 Not Found       - Resource not found
500 Internal Server Error - Server processing error
```

### Error Response Format
```json
{
  "error": "Description of what went wrong"
}
```

---

## Environment Configuration

### OAuth Provider Credentials
Set in `.env.local` (not committed to version control):

```env
SALESFORCE_CLIENT_ID=your_client_id
SALESFORCE_CLIENT_SECRET=your_client_secret
SALESFORCE_REDIRECT_URI=http://localhost:3000/api/integrations/salesforce/callback

HUBSPOT_CLIENT_ID=your_client_id
HUBSPOT_CLIENT_SECRET=your_client_secret
HUBSPOT_REDIRECT_URI=http://localhost:3000/api/integrations/hubspot/callback

SLACK_CLIENT_ID=your_client_id
SLACK_CLIENT_SECRET=your_client_secret
SLACK_REDIRECT_URI=http://localhost:3000/api/integrations/slack/callback

DATABASE_PUBLIC_URL=postgresql://user:pass@host:port/database
```

---

## Integration Data Flow

### Salesforce Sync Flow
```
1. Admin clicks "Configure" on Salesforce integration
2. Frontend calls: GET /api/integrations/salesforce?action=oauth-url
3. User redirected to Salesforce login
4. After auth, Salesforce redirects to callback with code
5. Frontend calls: POST /api/integrations/salesforce?action=callback with code
6. Backend exchanges code for access token
7. Access token stored in database (integrations table)
8. Admin triggers sync: POST /api/integrations/salesforce?action=sync
9. Backend fetches contacts from Salesforce API
10. Contacts mapped to advisors and stored/updated
```

### Meeting Transcript Flow
```
1. Gong/Fireflies webhook POSTs transcript to /api/integrations/meeting-intel
2. System extracts transcript text and participants
3. Matches participant email to advisor in database
4. Creates transcript record in DB
5. Triggers sentiment analysis (scaffolded)
6. Updates advisor engagement scores
7. Potentially sends Slack notification
8. Returns transcriptId to webhook sender
```

---

## Testing with cURL

### Test Admin Users API
```bash
# Get all users
curl http://localhost:3000/api/admin/users | jq

# Invite a user
curl -X POST http://localhost:3000/api/admin/users/invite \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","role":"manager"}' | jq
```

### Test Integrations API
```bash
# Get all integrations
curl http://localhost:3000/api/integrations | jq

# Get Salesforce OAuth URL
curl "http://localhost:3000/api/integrations/salesforce?action=oauth-url" | jq

# Save integration config
curl -X POST http://localhost:3000/api/integrations \
  -H "Content-Type: application/json" \
  -d '{
    "orgId":"org-123",
    "type":"slack",
    "status":"connected",
    "credentials":{"webhookUrl":"https://hooks.slack.com/..."},
    "settings":{"channel":"#deals"}
  }' | jq
```

### Test Meeting Intel Webhook
```bash
curl -X POST http://localhost:3000/api/integrations/meeting-intel \
  -H "Content-Type: application/json" \
  -d '{
    "webhookSource":"gong",
    "transcript":"Great meeting with customer",
    "participants":[{"email":"advisor@channel.com","name":"Tom"}],
    "recordedAt":"2026-03-31T14:30:00Z"
  }' | jq
```

---

## Security Notes

1. **OAuth Secrets**: Never commit `.env.local` containing OAuth credentials
2. **Webhook Validation**: Implement signature validation for webhook endpoints in production
3. **Authentication**: Add auth middleware to admin routes before deploying
4. **Encryption**: Encrypt stored credentials in database
5. **Rate Limiting**: Add rate limits to prevent abuse
6. **HTTPS**: Use HTTPS in production for OAuth callbacks

---

## Database Schema Notes

See `migrations/001-integrations-schema.sql` for full schema details:

- `integrations` table stores all integration configurations
- `audit_log` table tracks all admin actions
- `transcripts` table stores meeting transcripts
- `users` table for admin user management
- All tables have proper indices for performance
- Foreign key relationships with CASCADE deletes

---

## Support & Debugging

### Enable Debug Logging
Add to code:
```typescript
console.log('[Integration]', event, data);
```

### Check Integration Status
```bash
curl http://localhost:3000/api/integrations | jq '.[] | {type, status, lastSync}'
```

### Test Connection
Each integration has a `testConnection()` function in `lib/integrations/index.ts` that validates credentials.

### Common Issues
1. **OAuth state mismatch**: Ensure state parameter matches
2. **Missing access token**: Check credentials are saved before syncing
3. **Network first API**: API calls fallback to cache when offline
4. **Webhook not received**: Verify webhook URL is publicly accessible

---

## Future Enhancements

- [ ] Implement real OAuth flows with credential providers
- [ ] Complete Salesforce/HubSpot sync implementations
- [ ] Add webhook signature validation
- [ ] Implement credential encryption
- [ ] Add rate limiting
- [ ] Implement incremental syncs
- [ ] Add conflict resolution for duplicates
- [ ] Integrate transcript analysis with Claude API
- [ ] Add email notifications
- [ ] Implement retry logic with exponential backoff
