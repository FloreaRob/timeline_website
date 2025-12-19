# Brute Force Protection

## Overview

The login system now has **multi-layered protection** against brute force attacks:

### 1. Firebase Built-In Protection
Firebase Authentication automatically:
- Rate limits login attempts from the same IP address
- Temporarily disables accounts after too many failed attempts
- Returns `auth/too-many-requests` error code

### 2. Client-Side Rate Limiting (Added)
Additional protection layer that:
- Tracks failed login attempts in browser localStorage
- Implements progressive lockouts
- Shows countdown timer during lockout period

## How It Works

### Attempt Thresholds

| Attempts | Action |
|----------|--------|
| 1-2 | Normal error messages |
| 3-4 | Shows attempt count in error message |
| 5-9 | **30-second lockout** (soft limit) |
| 10+ | **5-minute lockout** (hard limit) |

### Lockout Behavior

**After 5 failed attempts:**
```
Error: "Multiple failed attempts (5). Please wait 30 seconds before trying again."
Button: "Locked (30s)" → countdown to "Locked (0s)"
```

**After 10 failed attempts:**
```
Error: "Too many failed login attempts (10). Account locked for 5 minutes for security."
Button: "Locked (5:00)" → countdown to "Locked (0:00)"
```

### Visual Indicators

1. **Attempt Counter** (after 3 attempts)
   - Error message shows: `"Incorrect password. (3 failed attempts)"`

2. **Lockout Timer**
   - Button text changes to: `"Locked (1:23)"` or `"Locked (15s)"`
   - Updates every second
   - User can see exactly how long to wait

3. **Auto-Unlock**
   - When timer reaches zero, button automatically re-enables
   - Error message disappears
   - User can try again

### Persistence

- **Lockout survives page refresh** - If user refreshes during lockout, timer continues
- **Reset on success** - Successful login clears all counters
- **Stored in localStorage** - Tied to the browser (clearing cache resets it)

## Technical Implementation

### Storage Keys
```javascript
login_attempts       // Number of failed attempts
login_lockout_until  // Timestamp when lockout expires
```

### Configuration Constants
```javascript
MAX_ATTEMPTS_SOFT = 5        // 30-second lockout
MAX_ATTEMPTS_HARD = 10       // 5-minute lockout
LOCKOUT_DURATION_SOFT = 30s
LOCKOUT_DURATION_HARD = 5min
```

### Flow Diagram
```
Login Attempt
    ↓
Is Locked Out? → YES → Show countdown, block attempt
    ↓ NO
Try Firebase Auth
    ↓
Success? → YES → Reset counters → Redirect
    ↓ NO
Increment counter
    ↓
Counter ≥ 10? → YES → 5-minute lockout
    ↓ NO
Counter ≥ 5? → YES → 30-second lockout
    ↓ NO
Show error with attempt count
```

## Security Benefits

### 1. **Slows Down Attacks**
- Attacker must wait 30s after 5 attempts
- Attacker must wait 5min after 10 attempts
- Makes automated brute force impractical

### 2. **User-Friendly**
- Legitimate users see clear countdown
- Auto-unlock means no manual intervention
- Attempt counter helps users realize they might have wrong password

### 3. **Layered Defense**
- Client-side: Fast, immediate feedback
- Server-side (Firebase): Catches sophisticated attacks
- Combined: Comprehensive protection

## Limitations & Bypasses

⚠️ **Important Security Notes:**

### Client-Side Limitations
- **LocalStorage can be cleared** - Attacker can clear browser storage
- **Multiple browsers** - Each browser has separate counters
- **Incognito mode** - Private browsing resets counters

### Why This Is Still Useful
1. **Stops casual attacks** - Prevents script kiddies and basic bots
2. **Slows down determined attackers** - Even if they bypass, Firebase still catches them
3. **Protects legitimate users** - Prevents accidental lockouts from typos
4. **Educational** - Shows good security practices

### Server-Side Protection (Firebase)
The **real protection** is Firebase's server-side rate limiting:
- Cannot be bypassed by clearing localStorage
- Tracks by IP address and account
- Permanent lockout after extreme abuse
- Professional-grade security

## Testing the Protection

### Test Scenario 1: Soft Lockout
1. Enter wrong password **5 times**
2. See: "Multiple failed attempts (5). Please wait 30 seconds..."
3. Button shows: "Locked (30s)"
4. Wait 30 seconds
5. Button unlocks automatically

### Test Scenario 2: Hard Lockout
1. Enter wrong password **10 times**
2. See: "Too many failed login attempts (10). Account locked for 5 minutes..."
3. Button shows: "Locked (5:00)"
4. Countdown continues even if you refresh page
5. Wait 5 minutes or clear localStorage to reset

### Test Scenario 3: Successful Login
1. Enter wrong password **3 times**
2. See: "Incorrect password. (3 failed attempts)"
3. Enter **correct** password
4. Counter resets to 0
5. Next wrong attempt shows "Incorrect password. (1 failed attempt)"

## Admin Override

If you need to reset a user's lockout:

### Option 1: Clear Browser Storage
```
1. Press F12 (Developer Tools)
2. Go to "Application" or "Storage" tab
3. Click "Local Storage" → Your site URL
4. Delete: login_attempts
5. Delete: login_lockout_until
6. Refresh page
```

### Option 2: Code Reset (for testing)
In browser console:
```javascript
localStorage.removeItem('login_attempts');
localStorage.removeItem('login_lockout_until');
location.reload();
```

## Monitoring

To check lockout status in browser console:
```javascript
// Check attempts
localStorage.getItem('login_attempts')

// Check lockout time
const lockout = localStorage.getItem('login_lockout_until');
if (lockout) {
  const remaining = parseInt(lockout) - Date.now();
  console.log(`Locked for ${Math.ceil(remaining/1000)} more seconds`);
}
```

## Future Enhancements

Possible improvements:
- [ ] CAPTCHA after 3 attempts
- [ ] Email notification of failed attempts
- [ ] IP-based tracking (requires backend)
- [ ] Account recovery flow
- [ ] Two-factor authentication (2FA)
- [ ] Biometric authentication

## Files Modified

- [`js/auth.js`](js/auth.js) - Added rate limiting functions
- [`index.html`](index.html) - Updated script version (cache busting)

## Configuration

To adjust thresholds, edit `js/auth.js`:
```javascript
const MAX_ATTEMPTS_SOFT = 5;  // Change to your preference
const MAX_ATTEMPTS_HARD = 10; // Change to your preference
const LOCKOUT_DURATION_SOFT = 30 * 1000; // 30 seconds
const LOCKOUT_DURATION_HARD = 5 * 60 * 1000; // 5 minutes
```

## Summary

✅ **5 failed attempts** = 30-second timeout
✅ **10 failed attempts** = 5-minute timeout
✅ **Countdown timer** visible on button
✅ **Survives page refresh**
✅ **Auto-resets** on successful login
✅ **Works with Firebase** rate limiting

Your login system is now protected against brute force attacks! 🔒
