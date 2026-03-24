# Account Approval Issue - Troubleshooting Guide

## Problem Summary
✅ Approval appears to succeed (green toast, tab switches)  
❌ But status reverts back to "pending" in the database  
❌ Changes don't persist on page refresh

## Diagnosis Process (Follow These Steps)

### Step 1: Fix the Real-Time Listener Issue
The real-time listener is using Firestore syntax instead of Supabase syntax. **This should be disabled for now:**

In index.html, find the `setupAdminRealtimeListener()` function and replace the entire function with:

```javascript
function setupAdminRealtimeListener() {
  console.log('⚙️ Real-time listener disabled (using polling instead)');
  // Real-time listeners temporarily disabled until issue is resolved
  // Admin updates will refresh when tab is switched
}
```

### Step 2: Browser Console Test
1. Open the employee management portal in your browser
2. Login as admin
3. Open DevTools with F12
4. Paste the contents of `test-approval-in-browser.js` into the Console tab
5. Review the test output:
   - ✅ If it says "SUCCESS! Approval is working correctly!" → The issue is NOT in the database
   - ❌ If it says status reverted to pending → The issue IS in the database

### Step 3: Fix RLS Policies (If Needed)
If the browser test shows the database is the problem:

1. Open your Supabase Dashboard (https://app.supabase.com)
2. Go to: SQL Editor
3. Copy and paste the entire contents of `fix-rls-policies.sql`
4. Click "Run" to execute all the SQL commands
5. Review the output to ensure all policies were created successfully

### Step 4: Run Detailed Database Diagnostics
If the issue persists:

1. Go to Supabase → SQL Editor
2. Paste contents of `debug-approval-issue.sql`
3. Run each command one at a time and review output:
   - Check if RLS is enabled
   - Check what policies exist
   - Test a manual UPDATE
   - Look for database triggers that might be reverting the status
   - Check for constraints on the status column

### Step 5: Verify the Improved Approval Function
Ensure you have the updated `approveAdminUser()` function with:
- ✅ Better error logging
- ✅ Database verification after update
- ✅ Retry logic if update fails

The function is already updated in index.html (check lines 4283-4339)

## Expected Behavior After Fix

1. Admin clicks "Approve" on pending account
2. Console shows: `✅ Update response: ...` and `✅ Database verification - User status is now: approved`
3. Success toast appears: "✅ Account approved!"
4. UI switches to Active tab
5. User list shows the account as ACTIVE (green badge)
6. If user logs out and logs back in → Account still shows as approved
7. If database is refreshed directly → Status is "approved"

## Common Issues & Solutions

### Issue: "operator does not exist: text = uuid"
**Solution:** Already fixed with new RLS policies

### Issue: "row-level security policy"
**Solution:** Check RLS policies are created correctly with `SELECT * FROM pg_policies WHERE tablename = 'users';`

### Issue: "UPDATE returns null or empty data"
**Solution:** This is normal in Supabase Postgres - focus on the verification query

### Issue: Status keeps reverting to "pending"
**Solution:** 
- Check for database triggers: `SELECT * FROM information_schema.triggers WHERE event_object_table = 'users';`
- Check for CHECK constraints: `SELECT * FROM information_schema.check_constraints;`
- May need to drop/recreate triggers if they exist

## What Each File Contains

- **fix-rls-policies.sql** - SQL script to recreate proper RLS policies
- **debug-approval-issue.sql** - Detailed diagnostic queries to run in Supabase
- **test-approval-in-browser.js** - JavaScript test to run in browser console
- **index.html** - Updated with improved approval function

## Quick Fix Checklist

- [ ] Disable real-time listener (replace setupAdminRealtimeListener function)
- [ ] Run browser console test
- [ ] If database test fails, run fix-rls-policies.sql
- [ ] Test approval again
- [ ] If still failing, run debug-approval-issue.sql
- [ ] Look for and resolve any triggers/constraints
- [ ] Test approval one more time

## Contact/Help

If approval still doesn't work after following all steps:
1. Share the output from `debug-approval-issue.sql`
2. Share the browser console error messages
3. Share the database policy list (`SELECT * FROM pg_policies WHERE tablename = 'users';`)
