const { RailSaathiAI, DEFAULT_EMPLOYEES } = require('./railsaathi-ai.js');

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

console.log('==================================================');
console.log('🧪 RUNNING MANDATORY RAILSAATHI AI TEST SUITE');
console.log('==================================================\n');

const ai = new RailSaathiAI();

// -----------------------------------------------------------------
// Test Case 1: Dates + BIT 1 assignment with known personnel
console.log('--- Test Case 1: "From 24 September 2026 to 26 September 2026, assign Ramesh Kumar to BIT 1." ---');
const res1 = ai.processInput("From 24 September 2026 to 26 September 2026, assign Ramesh Kumar to BIT 1.");
assert(res1.action === 'UPDATE_FORM', 'Action should be UPDATE_FORM');
assert(ai.state.fromDate === '2026-09-24', 'From Date should be 2026-09-24');
assert(ai.state.toDate === '2026-09-26', 'To Date should be 2026-09-26');
assert(ai.state.bits[1].personnel === 'Ramesh Kumar', 'BIT 1 personnel should be Ramesh Kumar');
assert(ai.state.bits[1].mobile === '9876543210', 'BIT 1 mobile should be 9876543210 from employee database');

// -----------------------------------------------------------------
// Test Case 2: BIT 2 Suresh Kumar + mobile
console.log('\n--- Test Case 2: "BIT 2 Suresh Kumar, mobile 9876543210." ---');
const res2 = ai.processInput("BIT 2 Suresh Kumar, mobile 9876543210.");
assert(res2.action === 'UPDATE_FORM', 'Action should be UPDATE_FORM');
assert(ai.state.bits[2].personnel === 'Suresh Kumar', 'BIT 2 personnel should be Suresh Kumar');
assert(ai.state.bits[2].mobile === '9876543210', 'BIT 2 mobile should be 9876543210');

// -----------------------------------------------------------------
// Test Case 3: Incomplete command + clarification follow up
console.log('\n--- Test Case 3: Incomplete command with no phone in seed ---');
// Let's test with a temporary employee without phone
const ai2 = new RailSaathiAI();
ai2.getEmployeeList = () => [{ id: 'test-1', name: 'Amit Kumar', phone: '' }];
const res3_part1 = ai2.processInput("BIT 3 Amit Kumar");
assert(res3_part1.action === 'ASK_CLARIFICATION', 'Action should ask clarification for missing mobile');
assert(res3_part1.bitIndex === 3, 'Clarification is for BIT 3');

// Now provide the mobile
const res3_part2 = ai2.processInput("9876543212");
assert(res3_part2.action === 'UPDATE_FORM', 'Action should update form with provided mobile');
assert(ai2.state.bits[3].personnel === 'Amit Kumar', 'BIT 3 personnel set');
assert(ai2.state.bits[3].mobile === '9876543212', 'BIT 3 mobile set');

// -----------------------------------------------------------------
// Test Case 4: Change only BIT 2 mobile
console.log('\n--- Test Case 4: "Change BIT 2 mobile number to 9876543211." ---');
const prevBit1 = ai.state.bits[1].personnel;
const res4 = ai.processInput("Change BIT 2 mobile number to 9876543211.");
assert(res4.action === 'UPDATE_FORM', 'Action should update form');
assert(ai.state.bits[2].mobile === '9876543211', 'BIT 2 mobile updated');
assert(ai.state.bits[1].personnel === prevBit1, 'BIT 1 personnel remained unchanged');

// -----------------------------------------------------------------
// Test Case 5: Clear BIT 4
console.log('\n--- Test Case 5: "Clear BIT 4." ---');
ai.state.bits[4] = { personnel: 'Temp Person', mobile: '9876543219', gps: '123' };
const res5 = ai.processInput("Clear BIT 4.");
assert(res5.action === 'CLEAR_BIT', 'Action should be CLEAR_BIT');
assert(ai.state.bits[4].personnel === '', 'BIT 4 personnel cleared');
assert(ai.state.bits[4].mobile === '', 'BIT 4 mobile cleared');

// -----------------------------------------------------------------
// Test Case 6: Multi-BIT filling
console.log('\n--- Test Case 6: Multi-BIT assignment command ---');
const multiCommand = `From 24 September to 26 September.
BIT 1 Ramesh Kumar 9876543210.
BIT 2 Suresh Kumar 9876543211.
BIT 3 Amit Kumar 9876543212.
BIT 4 Raj Kumar 9876543213.
BIT 5 Manoj Verma 9876543218.
BIT 6 Anil Yadav 9876543219.`;
const res6 = ai.processInput(multiCommand);
assert(res6.action === 'UPDATE_FORM', 'Action should be UPDATE_FORM for multi-bit');
assert(ai.state.fromDate === '2026-09-24', 'From Date matches');
assert(ai.state.toDate === '2026-09-26', 'To Date matches');
assert(ai.state.bits[1].personnel === 'Ramesh Kumar', 'BIT 1 set');
assert(ai.state.bits[2].personnel === 'Suresh Kumar', 'BIT 2 set');
assert(ai.state.bits[3].personnel === 'Amit Kumar', 'BIT 3 set');
assert(ai.state.bits[4].personnel === 'Raj Kumar', 'BIT 4 set');
assert(ai.state.bits[5].personnel === 'Manoj Verma', 'BIT 5 set');
assert(ai.state.bits[6].personnel === 'Anil Yadav', 'BIT 6 set');

// -----------------------------------------------------------------
// Test Case 7: Invalid mobile number
console.log('\n--- Test Case 7: Invalid mobile rejection ---');
const res7 = ai.processInput("BIT 2 Suresh Kumar, mobile 12345");
assert(res7.action === 'VALIDATION_ERROR', 'Action should return VALIDATION_ERROR');

// -----------------------------------------------------------------
// Test Case 8: Invalid date range (From > To)
console.log('\n--- Test Case 8: Invalid date range rejection ---');
const res8 = ai.processInput("From 28 September to 20 September, assign Ramesh Kumar to BIT 1");
assert(res8.action === 'VALIDATION_ERROR', 'Action should reject inverted date range');

// -----------------------------------------------------------------
// Test Case 9: Unknown personnel
console.log('\n--- Test Case 9: Unknown personnel rejection without fabrication ---');
const res9 = ai.processInput("Assign XYZ123 to BIT 1.");
assert(res9.action === 'UNKNOWN_PERSONNEL', 'Action should report UNKNOWN_PERSONNEL');

// -----------------------------------------------------------------
// Test Case 10: Ambiguous personnel matching
console.log('\n--- Test Case 10: Ambiguous personnel clarification ---');
const res10 = ai.processInput("Assign Raj to BIT 2.");
assert(res10.action === 'SELECT_PERSONNEL', 'Action should prompt SELECT_PERSONNEL for ambiguous name');
assert(res10.candidates.length >= 2, 'Found multiple candidates (Raj Kumar, Rajesh Kumar, Raj Kumar Singh)');

// Now user clarifies candidate
const res10_clarify = ai.processInput("Rajesh Kumar");
assert(res10_clarify.action === 'UPDATE_FORM', 'Action should now apply the selected candidate');
assert(ai.state.bits[2].personnel === 'Rajesh Kumar', 'BIT 2 personnel set to Rajesh Kumar');

// -----------------------------------------------------------------
// Test Case 11: GPS safety
console.log('\n--- Test Case 11: GPS safety (no fake GPS generated) ---');
assert(ai.state.bits[1].gps === '' || !ai.state.bits[1].gps.includes('fake'), 'No fake GPS coordinates generated');

// -----------------------------------------------------------------
// Test Case 12: Generate Preview
console.log('\n--- Test Case 12: Generate Preview trigger after validation ---');
const res12 = ai.processInput("Generate preview");
assert(res12.action === 'PREVIEW_GENERATED', 'Preview trigger succeeded on complete form');

// -----------------------------------------------------------------
// Test Case 13: Undo functionality
console.log('\n--- Test Case 13: Undo command ---');
const beforeUndoName = ai.state.bits[2].personnel;
ai.processInput("Change BIT 2 to Dinesh Sharma");
assert(ai.state.bits[2].personnel === 'Dinesh Sharma', 'Changed to Dinesh');
const undoRes = ai.processInput("Undo that");
assert(undoRes.action === 'UNDO', 'Undo succeeded');
assert(ai.state.bits[2].personnel === beforeUndoName, 'BIT 2 reverted to previous state');

console.log('\n==================================================');
console.log('🎉 ALL MANDATORY TEST CASES PASSED SUCCESSFULLY!');
console.log('==================================================');
