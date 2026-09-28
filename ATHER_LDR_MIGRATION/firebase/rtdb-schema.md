# Realtime Database Schema

## Path: `ather_presence/{uid}`

Defined as `var PRESENCE_PATH = 'ather_presence'` in the source file.

One node per logged-in user. Written when the user authenticates, removed when they disconnect (via `onDisconnect().remove()`).

Used to show the "who's online" strip in the dashboard header.

### Node Fields

| Field | Type | Value | Notes |
|-------|------|-------|-------|
| `uid` | string | Firebase Auth UID | User's unique ID |
| `email` | string | `user@girnarsoft.com` | User's email |
| `name` | string | Display name | From Google Auth profile |
| `photo` | string | URL or `""` | Google profile photo URL |
| `ts` | number | `ServerValue.TIMESTAMP` | Milliseconds since epoch |

### Example Node

```json
{
  "ather_presence": {
    "abc123uid": {
      "uid": "abc123uid",
      "email": "mihir.bhatt@girnarsoft.com",
      "name": "Mihir Bhatt",
      "photo": "https://lh3.googleusercontent.com/...",
      "ts": 1748000000000
    }
  }
}
```

### Lifecycle

1. **On login:** `setupPresence(user)` writes the node
2. **On disconnect:** `presRef.onDisconnect().remove()` schedules automatic deletion
3. **On signout:** `getFbAuth().signOut()` triggers the disconnect handler

### Security Rules

From `firebase/realtime-database.rules.json`:

```json
{
  "rules": {
    "ather_presence": {
      "$uid": {
        ".read": "auth != null && (auth.uid === $uid || root.child('ather_users').child(auth.uid).child('role').val() === 'admin')",
        ".write": "auth != null && auth.uid === $uid"
      }
    }
  }
}
```

- **Read:** A user can read their own node; admins can read any node
- **Write:** A user can only write to their own node
- **No cross-user writes:** Prevents presence spoofing

### Important Notes

- RTDB is optional for the dashboard to function. If RTDB is not configured or fails to initialize, `setupPresence()` returns `null` and the presence strip shows no other users
- The `getFbRTDB()` function has a try/catch that logs a warning if RTDB is not configured:
  ```
  [ATHER AUTH] Realtime Database not configured — presence disabled
  ```
- Presence data is ephemeral — it resets on every page load and clears on disconnect

## RTDB Configuration

The database URL is hardcoded in `FIREBASE_CONFIG`:
```js
databaseURL: 'https://ather-ldr-dashboard-default-rtdb.firebaseio.com'
```

This matches the default RTDB URL for a project named `ather-ldr-dashboard`. If you create the
Firebase project with a different name, you must update this URL.
