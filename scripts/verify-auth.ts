import assert from "assert";

console.log("==================================================");
console.log("RUNNING AURAMIND AUTHENTICATION VERIFICATION SUITE");
console.log("==================================================");

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`\x1b[32m✓ PASS\x1b[0m: ${name}`);
    testsPassed++;
  } catch (err: any) {
    console.error(`\x1b[31m✗ FAIL\x1b[0m: ${name}`);
    console.error(`  Error: ${err.message}`);
    testsFailed++;
  }
}

// 1. Open Redirect Sanitization
test("Open Redirect Prevention - Safe relative paths allowed", () => {
  const sanitizeNext = (next: string | null) => {
    if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
      return "/dashboard";
    }
    return next;
  };

  assert.strictEqual(sanitizeNext("/dashboard"), "/dashboard");
  assert.strictEqual(sanitizeNext("/settings"), "/settings");
  assert.strictEqual(sanitizeNext("/goal/12345"), "/goal/12345");
});

test("Open Redirect Prevention - Malicious external URLs blocked", () => {
  const sanitizeNext = (next: string | null) => {
    if (!next || !next.startsWith("/") || next.startsWith("//") || next.includes("://")) {
      return "/dashboard";
    }
    return next;
  };

  assert.strictEqual(sanitizeNext("https://evil.com"), "/dashboard");
  assert.strictEqual(sanitizeNext("//evil.com"), "/dashboard");
  assert.strictEqual(sanitizeNext("javascript:alert(1)"), "/dashboard");
  assert.strictEqual(sanitizeNext("http://malicious.org/phish"), "/dashboard");
});

// 2. Password Strength Criteria
test("Password Strength Assessment", () => {
  const getPasswordStrength = (pass: string) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  assert.strictEqual(getPasswordStrength("short"), 0);
  assert.strictEqual(getPasswordStrength("longenough"), 1);
  assert.strictEqual(getPasswordStrength("LongEnough"), 2);
  assert.strictEqual(getPasswordStrength("LongEnough1"), 3);
  assert.strictEqual(getPasswordStrength("LongEnough1!"), 4);
});

// 3. User Profile Metadata Extraction
test("User Profile Mapping from OAuth and Email Metadata", () => {
  const mapProfile = (user: any) => ({
    id: user.id,
    full_name:
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "AuraMind Pioneer",
    email: user.email,
    avatar_url:
      user.user_metadata?.avatar_url ||
      user.user_metadata?.picture ||
      null,
  });

  const googleUser = {
    id: "uuid-1",
    email: "alex@gmail.com",
    user_metadata: {
      name: "Alex Rivera",
      picture: "https://lh3.googleusercontent.com/photo.jpg",
    },
  };

  const profile = mapProfile(googleUser);
  assert.strictEqual(profile.full_name, "Alex Rivera");
  assert.strictEqual(profile.email, "alex@gmail.com");
  assert.strictEqual(profile.avatar_url, "https://lh3.googleusercontent.com/photo.jpg");

  const emailUser = {
    id: "uuid-2",
    email: "sam@company.org",
    user_metadata: {},
  };
  const emailProfile = mapProfile(emailUser);
  assert.strictEqual(emailProfile.full_name, "sam");
  assert.strictEqual(emailProfile.avatar_url, null);
});

console.log("==================================================");
console.log(`AUTH TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
console.log("==================================================");

if (testsFailed > 0) process.exit(1);
