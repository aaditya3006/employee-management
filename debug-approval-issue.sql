-- ========================================
-- DEBUGGING SCRIPT FOR APPROVAL ISSUE
-- ========================================
-- Run these commands in your Supabase SQL Editor to diagnose the approval issue

-- 1. CHECK TABLE STRUCTURE
\d public.users

-- 2. CHECK RLS IS ENABLED
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 3. VIEW ALL POLICIES
SELECT * FROM pg_policies 
WHERE tablename = 'users';

-- 4. TEST WITH A REAL UID FROM YOUR DATABASE
-- First, get a pending user:
SELECT uid, email, status FROM public.users 
WHERE status = 'pending' 
LIMIT 1;

-- 5. TEST UPDATE (copy a uid from step 4 and run this)
-- CHANGE 'TEST_UID_HERE' to an actual uid from step 4
UPDATE public.users 
SET status = 'approved'
WHERE uid = 'TEST_UID_HERE';

-- 6. VERIFY UPDATE WORKED
SELECT uid, email, status FROM public.users 
WHERE uid = 'TEST_UID_HERE';

-- 7. CHECK FOR DATABASE TRIGGERS that might revert status
SELECT trigger_schema, trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'users';

-- 8. CHECK FOR CONSTRAINTS
SELECT constraint_type, constraint_name, table_name
FROM information_schema.table_constraints
WHERE table_name = 'users';

-- 9. CHECK COLUMN CONSTRAINTS
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 10. Check if there's a CHECK constraint on status column
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%status%' OR constraint_name LIKE '%users%';

-- 11. If you find the issue, you can manually test the full flow:
-- a) Start with a pending user
-- b) Update status to approved
-- c) Wait 1 second
-- d) Read it back
-- e) It should still be 'approved'

-- If it's still 'pending' after updating to 'approved', there's a constraint or trigger reverting it.
