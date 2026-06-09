# UX Fix Report

## Files Changed

`src/app/admin/page.tsx` — three minimal edits, no logic or styling changes.

---

## Changes

### UX-001 — Rate-limit error message not surfaced

**Location:** `handleLogin()`, error branch  
**Before:** Any non-success response showed "Wrong password".  
**After:** HTTP 429 responses display the `error` string returned by the API (e.g. "Too many failed attempts. Try again in 14 minutes."). HTTP 401 continues to show "Wrong password". Network failures show "Login failed. Please try again."

```diff
-      } else {
-        setMsg('Wrong password')
+      } else if (res.status === 429) {
+        setMsg(data.error || 'Too many attempts. Please try again later.')
+      } else {
+        setMsg('Wrong password')
       }
```

### UX-002 — Password persists in form after logout

**Location:** `handleLogout()` + password `<input>`  
**Before:** Logout called `setAuth(false)` only; `pass` and `msg` state retained their values.  
**After:** Logout clears both `pass` and `msg` before resetting auth state. Added `autoComplete="off"` to the password field to prevent browser autofill from re-populating credentials after session end.

```diff
   async function handleLogout() {
     await fetch('/api/admin/logout', { method: 'POST' })
+    setPass('')
+    setMsg('')
     setAuth(false)
   }
```

```diff
-  <input type="password" value={pass} ... />
+  <input type="password" value={pass} ... autoComplete="off" />
```

---

## Verification Performed

- `npx tsc --noEmit` — no type errors
- UX-001: With rate limiting active, the API returns `{ error: "Too many failed attempts. Try again in X minutes." }` with status 429; the frontend now renders that message verbatim.
- UX-002: After logout, `pass` is `''` so the input re-renders empty; `autoComplete="off"` instructs the browser not to inject saved credentials into this field.
