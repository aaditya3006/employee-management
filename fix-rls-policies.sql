-- ========================================
-- FIX RLS POLICIES FOR USERS TABLE
-- ========================================
-- Run this in your Supabase SQL Editor

-- 1. FIRST - Check current policies
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 2. Drop existing problematic policies (do this one by one if needed)
DROP POLICY IF EXISTS "Allow authenticated users to select" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to update" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to insert" ON public.users;
DROP POLICY IF EXISTS "Allow authenticated users to delete" ON public.users;
DROP POLICY IF EXISTS "Allow select for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow update for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow delete for authenticated users" ON public.users;

-- 3. Enable RLS on users table (if not already enabled)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4. Create NEW PERMISSIVE policies allowing authenticated users

-- SELECT policy - Allow authenticated users to see all users
CREATE POLICY "select_all_users" ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- UPDATE policy - Allow authenticated users to update users (for admins)
CREATE POLICY "update_users" ON public.users
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- INSERT policy - Allow authenticated users to insert
CREATE POLICY "insert_users" ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- DELETE policy - Allow authenticated users to delete
CREATE POLICY "delete_users" ON public.users
  FOR DELETE
  TO authenticated
  USING (true);

-- 5. Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'users';

-- 6. Test an UPDATE to verify it works:
-- UPDATE public.users SET status = 'approved' WHERE uid = 'YOUR_TEST_UID';
-- SELECT uid, email, status FROM public.users WHERE uid = 'YOUR_TEST_UID';
