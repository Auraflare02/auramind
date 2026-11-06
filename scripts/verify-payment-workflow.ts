import {
  submitPaymentRequest,
  getUserPaymentRequests,
  getAllPaymentRequests,
  approvePaymentRequest,
  rejectPaymentRequest,
  inMemoryPaymentRequests,
} from "../lib/payments/client";
import { getUserSubscription, inMemorySubscriptions } from "../lib/subscription/client";

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ [FAIL] ${msg}`);
    process.exit(1);
  }
  console.log(`✔ [PASS] ${msg}`);
}

async function runTests() {
  console.log("\n========================================================");
  console.log("   AURAMIND UPI QR PAYMENT & APPROVAL TEST SUITE        ");
  console.log("========================================================\n");

  const testUserId = "user-test-upi-999";
  const testEmail = "upi_pioneer@auramind.ai";

  // 1. Initial State: user is default Gold
  const initialSub = await getUserSubscription(testUserId);
  assert(initialSub.tier === "gold", "User starts with default Gold tier");

  // 2. Submit payment for Platinum plan
  const txId = "UPI-REF-439281745620";
  const submitRes = await submitPaymentRequest({
    userId: testUserId,
    userEmail: testEmail,
    tier: "platinum",
    billingCycle: "monthly",
    amount: 699,
    transactionId: txId,
    notes: "Paid via Google Pay, GPay name: Pioneer Rider",
  });

  assert(submitRes.ok === true, "Payment request submitted successfully");
  assert(submitRes.request.status === "pending", "Submitted payment request status is pending");
  assert(submitRes.request.transactionId === txId, "Transaction ID stored accurately");
  assert(submitRes.request.tier === "platinum", "Requested tier is Platinum");
  assert(submitRes.request.amount === 699, "Amount is ₹699");

  // 3. User can see their pending payment request
  const userRequests = await getUserPaymentRequests(testUserId);
  assert(userRequests.length >= 1, "User can view their payment requests");
  assert(userRequests[0].status === "pending", "User request shows pending status");

  // 4. Admin can list pending requests
  const adminPending = await getAllPaymentRequests("pending");
  const foundInAdmin = adminPending.find((r) => r.id === submitRes.request.id);
  assert(Boolean(foundInAdmin), "Admin queue includes the pending payment request");

  // 5. User subscription remains Gold while pending
  const subWhilePending = await getUserSubscription(testUserId);
  assert(subWhilePending.tier === "gold", "Subscription is NOT activated before admin approval");

  // 6. Admin approves payment request
  const approveRes = await approvePaymentRequest(submitRes.request.id, "Admin Ridham");
  assert(approveRes.ok === true, "Admin approval returns ok");
  assert(approveRes.request.status === "approved", "Payment status updated to approved");
  assert(approveRes.request.reviewedBy === "Admin Ridham", "Reviewer recorded accurately");

  // 7. Plan is now ACTIVE for the user!
  const subAfterApproval = await getUserSubscription(testUserId);
  assert(subAfterApproval.tier === "platinum", "User subscription successfully upgraded to Platinum!");
  assert(subAfterApproval.status === "active", "Subscription status is active");
  assert(subAfterApproval.plan.maxGoals === 3, "Platinum goal limit (3) unlocked");
  assert(subAfterApproval.plan.maxFriends === 15, "Platinum friend limit (15) unlocked");
  assert(subAfterApproval.plan.whatsAppCheckins === true, "WhatsApp check-ins unlocked");

  // 8. Test invalid transaction ID validation
  try {
    await submitPaymentRequest({
      userId: testUserId,
      userEmail: testEmail,
      tier: "diamond",
      transactionId: "  ",
    });
    assert(false, "Empty transaction ID should throw error");
  } catch (err: any) {
    assert(err.message.includes("Transaction ID"), "Empty transaction ID rejected with error");
  }

  // 9. Test Rejection flow
  const rejectTxId = "FAKE-TX-000000";
  const submitReject = await submitPaymentRequest({
    userId: "user-test-reject",
    userEmail: "fraud_test@auramind.ai",
    tier: "diamond",
    amount: 1299,
    transactionId: rejectTxId,
  });

  const rejectRes = await rejectPaymentRequest(
    submitReject.request.id,
    "Bank UTR not found on statement",
    "Admin Reviewer"
  );
  assert(rejectRes.ok === true, "Admin rejection returns ok");
  assert(rejectRes.request.status === "rejected", "Payment request status is rejected");
  assert(Boolean(rejectRes.request.notes?.includes("Bank UTR not found")), "Rejection reason saved");

  console.log("\n========================================================");
  console.log("  ALL PAYMENT & ADMIN APPROVAL TESTS PASSED!            ");
  console.log("========================================================\n");
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
