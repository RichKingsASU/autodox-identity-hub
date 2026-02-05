
# Fix Email Verification to Use Only Resend with Proper Branding

## Problem Analysis
The current system sends **two emails** during signup:
1. **Stock Supabase email** - contains the actual verification link but has generic branding
2. **Custom Resend email** - has your branding but tells users to "look for the Supabase email" instead of containing the link

Additionally, the "Resend Verification Email" button uses `supabase.auth.resend()` which triggers another stock Supabase email.

## Solution Overview
Consolidate all verification emails through Resend with your branding by:
1. Generating verification links using Supabase Admin API
2. Sending all emails via Resend with proper branding
3. Disabling the stock Supabase email system

## Changes Required

### 1. Update Edge Function: `send-signup-verification`
**File:** `supabase/functions/send-signup-verification/index.ts`

**Changes:**
- Use `auth.admin.generateLink({ type: "signup", ... })` to create the actual verification link
- Embed the link in the branded HTML template with a clickable button
- Fetch brand settings for dynamic sender identity
- Remove the "check your inbox for Supabase email" messaging

**New Flow:**
```
User Signs Up → Edge Function generates link via Admin API → Resend sends branded email with link
```

### 2. Update Email Verification Screen
**File:** `src/components/auth/EmailVerificationScreen.tsx`

**Changes:**
- Replace `supabase.auth.resend()` with a call to the custom `send-signup-verification` Edge Function
- This ensures resent emails also go through Resend with branding

### 3. Update Auth Hook
**File:** `src/hooks/useAuth.ts`

**Changes:**
- Remove the comment about "Supabase's default email was still sent" since we're disabling it
- Pass the user's name to the Edge Function for personalization

### 4. Add Default Brand Email Settings
**Database:** `brand_email_settings` table

**Insert default record:**
- `from_name`: "Autodox"
- `from_email`: "noreply@email.agents-institute.com"
- `reply_to_email`: "support@agents-institute.com"

### 5. Disable Supabase Stock Email (Configuration)
Use the configure-auth tool to:
- Enable `autoConfirm` for emails **OR**
- Configure custom SMTP to point to Resend (preferred approach maintains verification requirement)

## Email Template Design
The branded email will include:
- **Subject:** "Verify Your Email - Autodox"
- **From:** "Autodox <noreply@email.agents-institute.com>"
- **Content:** Personalized greeting, clear CTA button with verification link, security notice
- **Footer:** Brand copyright with current year

## Technical Details

### Link Generation (Edge Function)
```typescript
const { data: linkData, error } = await supabase.auth.admin.generateLink({
  type: "signup",
  email,
  options: {
    redirectTo: `${origin}/`,
  },
});
const verificationLink = linkData.properties.action_link;
```

### Resend Verification (Frontend)
```typescript
// Before (triggers stock email):
await supabase.auth.resend({ type: "signup", email });

// After (uses branded Edge Function):
await supabase.functions.invoke("send-signup-verification", {
  body: { email, userName: "User" },
});
```

## Files to Modify
| File | Change |
|------|--------|
| `supabase/functions/send-signup-verification/index.ts` | Add link generation, update template |
| `src/components/auth/EmailVerificationScreen.tsx` | Use Edge Function for resend |
| `src/hooks/useAuth.ts` | Update comments, ensure proper data passed |
| Database | Insert default brand_email_settings record |

## Testing Plan
1. Sign up with a new email
2. Verify only ONE email arrives (from Resend)
3. Confirm the email has correct branding and working verification link
4. Test "Resend Verification Email" button sends branded email
5. Verify replies go to the correct address
