
# Fix Password Reset Flow

## Problem Summary

The password reset flow fails after the user clicks the email link and submits a new password. While auth logs show the password update succeeds (PUT `/user` returns 200), subsequent login attempts fail. The root causes are:

1. Missing error handling around async operations
2. Race condition between hash fragment processing and session detection
3. No recovery token extraction from URL
4. Silent failures when exceptions occur

## Architecture Issues

```text
Current Flow (Broken):
┌─────────────┐     ┌─────────────────┐     ┌────────────────┐
│ Click Email │────▶│ /reset-password │────▶│ Check Session  │──▶ May show "Invalid"
│    Link     │     │   #token=xxx    │     │  (race cond.)  │    before token processed
└─────────────┘     └─────────────────┘     └────────────────┘

Fixed Flow:
┌─────────────┐     ┌─────────────────┐     ┌────────────────┐     ┌───────────────┐
│ Click Email │────▶│ /reset-password │────▶│ Wait for Hash  │────▶│ Verify Session│
│    Link     │     │   #token=xxx    │     │  Processing    │     │   + Update PW │
└─────────────┘     └─────────────────┘     └────────────────┘     └───────────────┘
```

## Implementation Plan

### Step 1: Fix ResetPassword.tsx Session Handling

**Issue**: Race condition between Supabase processing the URL hash and the component checking for session

**Solution**: 
- Add explicit detection of URL hash containing recovery tokens
- Wait for Supabase to process the hash before checking session
- Add proper timeout for hash processing
- Improve PASSWORD_RECOVERY event handling

### Step 2: Add Try-Catch Error Handling

**Issue**: Async errors in `handleSubmit` aren't caught, leading to silent failures

**Solution**:
- Wrap `updatePassword` call in try-catch block
- Display appropriate error messages for all failure modes
- Add logging for debugging

### Step 3: Add Global Unhandled Rejection Handler

**Issue**: Unhandled promise rejections can crash the app

**Solution**:
- Add `unhandledrejection` event listener in App.tsx
- Show toast for uncaught errors
- Prevent default crash behavior

### Step 4: Improve useAuth updatePassword Function

**Issue**: No validation or session verification before password update

**Solution**:
- Verify session exists before attempting update
- Return more detailed error information
- Handle edge cases (expired session, etc.)

## Files to Modify

| File | Changes |
|------|---------|
| `src/pages/ResetPassword.tsx` | Fix session detection, add try-catch, handle URL hash |
| `src/hooks/useAuth.ts` | Add session validation to updatePassword |
| `src/App.tsx` | Add global unhandled rejection handler |

## Technical Details

### ResetPassword.tsx Changes

```typescript
// 1. Add hash detection on mount
useEffect(() => {
  const hash = window.location.hash;
  const hasRecoveryToken = hash.includes('type=recovery') || 
                           hash.includes('access_token');
  
  if (hasRecoveryToken) {
    // Supabase client will process this automatically
    // Just wait for the auth state change
    setIsValidSession(true);
  }
}, []);

// 2. Wrap submit in try-catch
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);
  setErrors({});

  try {
    // ... validation
    
    const { error } = await updatePassword(formData.password);

    if (error) {
      toast({
        variant: "destructive",
        title: "Update failed",
        description: error.message,
      });
      return;
    }

    setIsSuccess(true);
    toast({
      title: "Password updated!",
      description: "Your password has been successfully reset.",
    });
  } catch (error) {
    console.error("Password update error:", error);
    toast({
      variant: "destructive",
      title: "An unexpected error occurred",
      description: "Please try again or request a new reset link.",
    });
  } finally {
    setIsSubmitting(false);
  }
};
```

### App.tsx Global Error Handler

```typescript
useEffect(() => {
  const handleRejection = (event: PromiseRejectionEvent) => {
    console.error("Unhandled rejection:", event.reason);
    toast.error("An error occurred. Please try again.");
    event.preventDefault();
  };

  window.addEventListener("unhandledrejection", handleRejection);
  return () => window.removeEventListener("unhandledrejection", handleRejection);
}, []);
```

### useAuth.ts Improvement

```typescript
const updatePassword = async (newPassword: string) => {
  // Verify we have an active session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return { error: new Error("No active session. Please use the reset link from your email.") };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });
  
  return { error };
};
```

## Testing Plan

After implementation:
1. Request password reset from login modal
2. Click link in email
3. Verify reset form appears (not "Invalid Link" message)
4. Enter new password and submit
5. Verify success message appears
6. Sign in with new password
7. Verify login succeeds

## Edge Cases to Handle

- User clicks same reset link twice (token consumed)
- User has multiple reset emails and clicks old one
- Session expires while user is typing new password
- Network error during password update
- User navigates away and back to reset page
