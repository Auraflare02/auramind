import assert from "assert";
import {
  encryptToken,
  decryptToken,
  createOAuthState,
  verifyOAuthState,
  computeEventHash,
} from "../lib/calendar/crypto";
import { normalizeTimeToHHMM } from "../lib/calendar/client";

async function runTests() {
  console.log("==================================================");
  console.log("   AURAMIND × GOOGLE CALENDAR VERIFICATION SUITE  ");
  console.log("==================================================\n");

  let passed = 0;
  let total = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      fn();
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  ✗ [FAIL] ${name}: ${err.message}`);
    }
  }

  // TEST 1: Encryption & Decryption Roundtrip
  test("AES-256-GCM token encryption & decryption roundtrip", () => {
    const originalToken = "1//04randomRefreshTokenFromGoogle_xyz123-SECRET";
    const encrypted = encryptToken(originalToken);

    assert(encrypted.includes(":"), "Encrypted token must have iv:authTag:cipher format");
    assert.notStrictEqual(encrypted, originalToken, "Encrypted token must not equal plaintext");

    const decrypted = decryptToken(encrypted);
    assert.strictEqual(decrypted, originalToken, "Decrypted token must exactly match original");
  });

  // TEST 2: Encryption produces distinct ciphertexts (IV uniqueness)
  test("Token encryption uses fresh random IV on each execution", () => {
    const token = "sample-google-oauth-token";
    const enc1 = encryptToken(token);
    const enc2 = encryptToken(token);
    assert.notStrictEqual(enc1, enc2, "Consecutive encryptions of the same string must yield distinct ciphertexts");
  });

  // TEST 3: Tamper detection in encrypted token
  test("Encrypted token tampering is rejected by GCM authentication tag", () => {
    const token = "secure-data";
    const encrypted = encryptToken(token);
    const parts = encrypted.split(":");
    // Tamper with ciphertext by flipping two hex characters
    const lastTwo = parts[2].slice(-2);
    const flipped = lastTwo === "aa" ? "bb" : "aa";
    const tampered = `${parts[0]}:${parts[1]}:${parts[2].slice(0, -2)}${flipped}`;

    let threw = false;
    try {
      decryptToken(tampered);
    } catch (e: any) {
      threw = true;
      assert(
        e.message.includes("authenticate") || e.message.includes("state"),
        `Unexpected error message: ${e.message}`
      );
    }
    assert(threw, "Tampered ciphertext must cause decryption to throw");
  });

  // TEST 4: OAuth State Creation and Verification
  test("Tamper-proof HMAC OAuth state parameter creation and verification", () => {
    const userId = "00000000-0000-0000-0000-000000000001";
    const returnUrl = "/goal/AmTest123";
    const state = createOAuthState(userId, returnUrl);

    assert(state.includes("."), "OAuth state must contain signature separator");

    const verified = verifyOAuthState(state);
    assert.strictEqual(verified.valid, true, "State must be verified valid");
    assert.strictEqual(verified.userId, userId, "User ID must match");
    assert.strictEqual(verified.returnUrl, returnUrl, "Return URL must match");
  });

  // TEST 5: OAuth State Tamper Rejection
  test("Tampered OAuth state signature is rejected (CSRF Protection)", () => {
    const userId = "00000000-0000-0000-0000-000000000001";
    const state = createOAuthState(userId, "/settings");
    const [payload, sig] = state.split(".");
    // Tamper with signature
    const tamperedSig = sig.slice(0, -2) + "xx";
    const tamperedState = `${payload}.${tamperedSig}`;

    const verified = verifyOAuthState(tamperedState);
    assert.strictEqual(verified.valid, false, "Tampered state must be invalid");
    assert(verified.error?.includes("signature mismatch"), "Error must indicate signature mismatch");
  });

  // TEST 6: Time Normalization
  test("Time parsing handles 12-hour AM/PM and 24-hour formats accurately", () => {
    assert.strictEqual(normalizeTimeToHHMM("07:00"), "07:00");
    assert.strictEqual(normalizeTimeToHHMM("7:00 AM"), "07:00");
    assert.strictEqual(normalizeTimeToHHMM("12:00 PM"), "12:00");
    assert.strictEqual(normalizeTimeToHHMM("12:00 AM"), "00:00");
    assert.strictEqual(normalizeTimeToHHMM("2:30 PM"), "14:30");
    assert.strictEqual(normalizeTimeToHHMM("11:45 PM"), "23:45");
    assert.strictEqual(normalizeTimeToHHMM("18:15"), "18:15");
  });

  // TEST 7: Event Hash Idempotency
  test("Event hash computation provides stable fingerprint for duplicate detection", () => {
    const details1 = {
      activity: "Deep Work: React Server Components",
      start: "09:00",
      end: "10:30",
      date: "2026-10-28",
      category: "practice",
    };
    const details2 = { ...details1 };
    const detailsModified = { ...details1, activity: "Deep Work: Next.js Routing" };

    const hash1 = computeEventHash(details1);
    const hash2 = computeEventHash(details2);
    const hashMod = computeEventHash(detailsModified);

    assert.strictEqual(hash1, hash2, "Identical tasks must yield identical hashes");
    assert.notStrictEqual(hash1, hashMod, "Modified tasks must yield distinct hashes");
  });

  // TEST 8: Conflict Detection Algorithm simulation
  test("Conflict overlap logic correctly identifies overlapping time windows", () => {
    function isOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
      return startA < endB && endA > startB;
    }

    // Planned: 10:00 - 11:30 (600 - 690)
    const planStart = 600;
    const planEnd = 690;

    // Existing event 1: 09:00 - 10:00 (No overlap, adjacent boundary)
    assert.strictEqual(isOverlap(planStart, planEnd, 540, 600), false, "Adjacent boundary must not overlap");

    // Existing event 2: 10:30 - 12:00 (Overlap!)
    assert.strictEqual(isOverlap(planStart, planEnd, 630, 720), true, "Partial overlap must be detected");

    // Existing event 3: 09:30 - 12:00 (Enclosing overlap)
    assert.strictEqual(isOverlap(planStart, planEnd, 570, 720), true, "Enclosing event must overlap");

    // Existing event 4: 10:15 - 10:45 (Sub-interval overlap)
    assert.strictEqual(isOverlap(planStart, planEnd, 615, 645), true, "Internal sub-interval must overlap");

    // Existing event 5: 12:00 - 13:00 (Completely after)
    assert.strictEqual(isOverlap(planStart, planEnd, 720, 780), false, "Later event must not overlap");
  });

  console.log(`\nResults: ${passed} of ${total} tests passed.\n`);
  if (passed !== total) {
    process.exit(1);
  }
}

runTests();
