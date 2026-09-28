# Firestore Schema

## Collection: `ather_users`

Defined as `var USERS_COL = 'ather_users'` in the source file.

One document per registered user. Document ID = Firebase Auth `uid`.

### Document Fields

| Field | Type | Values | Notes |
|-------|------|--------|-------|
| `email` | string | `user@girnarsoft.com` | User's Google email address |
| `displayName` | string | Full name | From Google Auth profile |
| `photoURL` | string | URL or `""` | Google profile photo URL |
| `role` | string | `pending`, `viewer`, `full`, `admin`, `client` | Access level |
| `createdAt` | Timestamp | Server timestamp | Set on first login |

### Role Values

| Role | Access Level |
|------|-------------|
| `pending` | No data access; sees "Access Pending" page |
| `viewer` | 3 tabs: Model Performance, State Performance, Geo & Dealer |
| `full` | All 7 tabs; no source columns hidden |
| `admin` | All 7 tabs + Admin panel for user management |
| `client` | 2 tabs: Model Performance, Geo & Dealer |

### Creation Flow

1. User signs in with Google
2. `ensureUserDoc()` is called
3. If document doesn't exist → creates with `role: isAdmin ? 'admin' : 'pending'`
4. If document exists → updates email/displayName/photoURL if changed
5. If user is admin email and role is not `'admin'` → auto-upgrades to `'admin'`

### Example Documents

**Admin user (auto-role)**:
```json
{
  "email": "mihir.bhatt@girnarsoft.com",
  "displayName": "Mihir Bhatt",
  "photoURL": "https://lh3.googleusercontent.com/...",
  "role": "admin",
  "createdAt": "2026-05-01T10:00:00Z"
}
```

**Standard user (starts pending)**:
```json
{
  "email": "analyst@girnarsoft.com",
  "displayName": "Analyst Name",
  "photoURL": "",
  "role": "pending",
  "createdAt": "2026-06-15T09:30:00Z"
}
```

## Security Rules Summary

Rules in `firebase/firestore.rules` enforce:

1. **Read own document:** User can always read their own `ather_users/{uid}` document
2. **Write own document:** User can write their own document UNLESS:
   - They are changing their `role` to `admin` (self-promotion to admin is blocked)
3. **Admin reads all:** User with `role == 'admin'` can read ALL documents in `ather_users`
4. **Admin writes all:** Admins can also update other users' documents (for role management)

## Manual Role Management

To change a user's role via Firebase Console:
1. Firestore → ather_users → find the user document (by UID or browse)
2. Click the `role` field
3. Change to desired value
4. Save

Or via the in-dashboard Admin panel (if you're an admin user):
1. Click the user avatar in the top-right header
2. Click "User Access Management" (person icon)
3. Use the role dropdown next to the user

## Indexes

No custom Firestore indexes are required. The dashboard only queries:
- `ather_users/{uid}` — direct document read by UID
- Admin reads the entire collection (no ordering/filtering)
