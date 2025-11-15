# Authentication System Testing Checklist

## User Registration
- [ ] Valid registration with all fields
- [ ] Valid registration with only required fields (email, password)
- [ ] Invalid email format rejected
- [ ] Password < 6 characters rejected
- [ ] Invalid phone format rejected
- [ ] Duplicate email rejected
- [ ] Verification email sent (check console in dev)
- [ ] Auto-login after successful registration

## Email Verification
- [ ] Valid token verifies email successfully
- [ ] Expired token (>24h) rejected
- [ ] Invalid token rejected
- [ ] Already verified email can't be verified again
- [ ] Redirects to login after verification

## Login
- [ ] Valid credentials login successfully
- [ ] Invalid email rejected
- [ ] Invalid password rejected
- [ ] Non-existent user rejected
- [ ] Session created with correct user data
- [ ] Session includes id and role
- [ ] Redirect to home page after login

## Password Reset
- [ ] Forgot password form sends email (check console)
- [ ] Non-existent email still returns success (security)
- [ ] Reset token works within 1 hour
- [ ] Expired reset token rejected
- [ ] Password updated successfully
- [ ] Can login with new password
- [ ] Old password no longer works

## Authorization
- [ ] Unauthenticated users redirected to /login
- [ ] USER role cannot access /admin
- [ ] USER role cannot access /staff
- [ ] USER role cannot access /gate
- [ ] STAFF role can access /staff
- [ ] STAFF role cannot access /admin
- [ ] ADMIN role can access all protected routes
- [ ] API routes return 401 when unauthenticated
- [ ] API routes return 403 when insufficient role

## Rate Limiting
- [ ] Registration endpoint limited (10 req/min)
- [ ] Login endpoint limited (10 req/min)
- [ ] Forgot password limited (3 req/15min)
- [ ] 429 status returned when exceeded
- [ ] Rate limit headers included in response
- [ ] Rate limit resets after window

## Session Management
- [ ] Session persists after page refresh
- [ ] Session expires after 30 days
- [ ] Logout clears session
- [ ] Multiple tabs share same session

## Security
- [ ] Passwords hashed in database
- [ ] Sensitive endpoints use HTTPS in production
- [ ] CSRF protection enabled (NextAuth default)
- [ ] Security headers present in responses
- [ ] No sensitive data in console logs (production)
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities in error messages
