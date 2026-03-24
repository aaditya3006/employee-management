// ========================================
// BROWSER CONSOLE TEST SCRIPT
// ========================================
// Open DevTools (F12) and paste this into the Console tab
// This will test if approval actually works and help identify the issue

async function testApprovalFlow() {
  console.clear();
  console.log('🧪 Starting Approval Diagnosis Test...\n');
  console.log('⚠️ IMPORTANT: Make sure you are logged in as admin before running this test!\n');
  
  try {
    // 1. Check Supabase client
    console.log('1️⃣ Checking Supabase client...');
    if (!window.db) {
      console.error('❌ Supabase client not initialized');
      console.error('   Did you load the portal page? window.db is missing');
      return;
    }
    console.log('✅ Supabase client ready\n');
    
    // 2. Check authenticated user
    console.log('2️⃣ Checking authenticated user...');
    
    // Try to get the session - handle both Supabase session formats
    const sessionResult = await window.db.auth.getSession();
    const session = sessionResult?.data?.session;
    
    console.log('   Session result:', sessionResult);
    console.log('   Session value:', session);
    
    if (!session) {
      console.error('❌ No active session found!');
      console.error('   Session data:', sessionResult?.data);
      
      // Try alternate method - check if we can get current user
      console.log('\n   Trying alternate method: getUser()...');
      const { data: { user }, error: userErr } = await window.db.auth.getUser();
      
      if (userErr) {
        console.error('❌ Auth error on getUser():', userErr.message);
        console.error('   ⚠️ YOU MUST FIRST: Log in to the portal as admin');
        console.error('   Then: Return to this console and run the test again');
        return;
      }
      
      if (!user) {
        console.error('❌ No user found even though page might be loaded');
        console.error('   Try: Reloading the page with F5');
        console.error('   Then: Log into admin and run test again');
        return;
      }
      
      console.log('✅ User found via getUser():', user.email);
    } else {
      console.log('✅ Active session found for user:', session.user?.email);
    }
    
    // Get current user for verification
    const { data: { user }, error: userErr } = await window.db.auth.getUser();
    if (!user) {
      console.error('❌ Cannot get user data');
      return;
    }
    console.log('✅ User authenticated:', user.email, '\n');
    
    // 3. Get a pending user to test with
    console.log('3️⃣ Fetching a pending user...');
    const { data: pendingUsers, error: fetchErr } = await window.db
      .from('users')
      .select('uid, email, status')
      .eq('status', 'pending')
      .limit(1);
    
    if (fetchErr) {
      console.error('❌ Fetch error:', fetchErr.message);
      return;
    }
    
    if (!pendingUsers || pendingUsers.length === 0) {
      console.warn('⚠️ No pending users found for testing');
      console.log('Please create a test account first');
      return;
    }
    
    const testUser = pendingUsers[0];
    console.log('✅ Found test user:', testUser.email, 'UID:', testUser.uid, '\n');
    
    // 4. Test UPDATE operation
    console.log('4️⃣ Attempting UPDATE to "approved"...');
    const { data: updateRes, error: updateErr } = await window.db
      .from('users')
      .update({ status: 'approved' })
      .eq('uid', testUser.uid);
    
    if (updateErr) {
      console.error('❌ UPDATE error:', updateErr.code, '-', updateErr.message);
      console.error('    Details:', updateErr.details);
      console.error('    Hint:', updateErr.hint);
      return;
    }
    console.log('✅ UPDATE returned successfully', '\n');
    
    // 5. Wait and verify
    console.log('5️⃣ Waiting 2 seconds then verifying...');
    await new Promise(r => setTimeout(r, 2000));
    
    const { data: checkUser, error: checkErr } = await window.db
      .from('users')
      .select('uid, email, status')
      .eq('uid', testUser.uid)
      .single();
    
    if (checkErr) {
      console.error('❌ Verification fetch error:', checkErr.message);
      return;
    }
    
    console.log('✅ Current status in database:', checkUser.status, '\n');
    
    if (checkUser.status === 'approved') {
      console.log('✅✅✅ SUCCESS! Approval is working correctly!');
      console.log('The status changed from "pending" to "approved" and stayed that way.');
    } else if (checkUser.status === 'pending') {
      console.error('❌❌❌ FAILURE! Status reverted to pending!');
      console.error('The UPDATE succeeded but the status reverted back to pending.');
      console.error('This suggests:');
      console.error('  - A database trigger is reverting the status');
      console.error('  - A constraint is preventing the update');
      console.error('  - RLS policy issue');
    } else {
      console.warn('⚠️ Status is:', checkUser.status);
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message);
    console.error(err);
  }
  
  console.log('\n📋 Test complete. Check the logs above for issues.');
}

// Run the test
testApprovalFlow();
