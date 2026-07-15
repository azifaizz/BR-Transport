const assert = require('assert');

async function runTests() {
  const API_URL = 'http://localhost:8080/api/bills';
  
  let bill101Id = null;
  
  try {
    console.log("------------------------------------------------------------");
    console.log("BR Transport Management System");
    console.log("Bill Management Functional Verification Report");
    console.log("------------------------------------------------------------");
    
    // Test Scenario 1 – Create Bill
    console.log("Running Test 1: Create Bill...");
    const billData = {
      customer: "Test Customer",
      date: "2023-10-10",
      deliveryType: "Test",
      emptyWeight: 10,
      inTime: "10:00 AM",
      loadWeight: 20,
      material: "Test Material",
      netWeight: 10,
      outTime: "11:00 AM",
      party: "Test Party",
      paymentType: "Cash",
      vehicleNumber: "TEST-01"
    };
    
    const createRes = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData)
    });
    
    if (!createRes.ok) throw new Error("Create Bill API failed");
    const createdBill = await createRes.json();
    
    assert(createdBill.billNumber !== undefined, "Bill Number should be assigned");
    assert(createdBill.id !== undefined, "Bill ID should be assigned");
    
    bill101Id = createdBill.id;
    const billNumber = createdBill.billNumber;
    
    const allBillsRes = await fetch(API_URL);
    const allBills = (await allBillsRes.json()).content || [];
    assert(allBills.find(b => b.id === bill101Id), "Bill should appear in All Bills");
    
    const deletedBillsRes = await fetch(`${API_URL}/deleted`);
    const deletedBills = (await deletedBillsRes.json()).content || [];
    assert(!deletedBills.find(b => b.id === bill101Id), "Bill should NOT appear in Deleted Bills");
    console.log("Test 1: PASS");
    
    // Test Scenario 2 - Bill Number Allocation
    console.log("Running Test 2: Bill Number Allocation...");
    assert(billNumber === 101 || billNumber > 0, "Bill Number is assigned");
    const billById = allBills.find(b => b.id === bill101Id);
    assert(billById.billNumber === billNumber, "Bill record is linked to assigned number");
    const sameNumberBills = allBills.filter(b => b.billNumber === billNumber);
    assert(sameNumberBills.length === 1, "No other bill has this number");
    console.log("Test 2: PASS");
    
    // Test Scenario 3 - Delete Bill
    console.log("Running Test 3: Delete Bill...");
    const delRes = await fetch(`${API_URL}/${bill101Id}`, { method: 'DELETE' });
    if (!delRes.ok) throw new Error("Delete API failed");
    
    const allBillsRes2 = await fetch(API_URL);
    const allBills2 = (await allBillsRes2.json()).content || [];
    assert(!allBills2.find(b => b.id === bill101Id), "Bill should disappear from All Bills");
    
    const deletedBillsRes2 = await fetch(`${API_URL}/deleted`);
    const deletedBills2 = (await deletedBillsRes2.json()).content || [];
    assert(deletedBills2.find(b => b.id === bill101Id), "Bill should appear in Deleted Bills");
    console.log("Test 3: PASS");
    
    // Test Scenario 4 - Create Another Bill
    console.log("Running Test 4: Create Another Bill...");
    const createRes2 = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(billData)
    });
    const createdBill2 = await createRes2.json();
    assert(createdBill2.billNumber > billNumber, "Next bill should receive next sequential number");
    console.log("Test 4: PASS");
    
    // Test Scenario 5 - Restore Bill
    console.log("Running Test 5: Restore Bill...");
    const restoreRes = await fetch(`${API_URL}/${bill101Id}/restore`, { method: 'POST' });
    if (!restoreRes.ok) throw new Error("Restore API failed");
    
    const allBillsRes3 = await fetch(API_URL);
    const allBills3 = (await allBillsRes3.json()).content || [];
    const restoredBill = allBills3.find(b => b.id === bill101Id);
    assert(restoredBill, "Bill should reappear in All Bills");
    assert(restoredBill.billNumber === billNumber, "Original Bill Number must remain unchanged");
    
    const deletedBillsRes3 = await fetch(`${API_URL}/deleted`);
    const deletedBills3 = (await deletedBillsRes3.json()).content || [];
    assert(!deletedBills3.find(b => b.id === bill101Id), "Bill should disappear from Deleted Bills");
    console.log("Test 5: PASS");
    
    // Database / Final Checks
    console.log("Running Database & UI Sync Verification...");
    assert(allBills3.filter(b => b.billNumber === billNumber).length === 1, "No duplicate Bill Numbers exist");
    
    console.log("\nAll Tests Passed Successfully! Returning report format...");
  } catch (error) {
    console.error("TEST FAILED:", error.message);
    process.exit(1);
  }
}

runTests();
