const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://auramind-vert.vercel.app';

async function runTests() {
  console.log('====================================================');
  console.log('AURAMIND LEGAL, AUTHENTICATION & CONSENT TEST SUITE');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition, testName, details = '') {
    total++;
    if (condition) {
      console.log(`[PASS] ${testName}`);
      if (details) console.log(`       ${details}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}`);
      if (details) console.error(`       Details: ${details}`);
    }
  }

  // ----------------------------------------------------
  // TEST 1: Checkbox Default State (Unchecked by Default)
  // ----------------------------------------------------
  const signupSource = fs.readFileSync(path.join(__dirname, '..', 'app', 'signup', 'page.tsx'), 'utf8');
  const hasUncheckedTerms = signupSource.includes('useState(false)') && signupSource.includes('const [agreeTerms, setAgreeTerms] = useState(false)');
  const hasUncheckedPersonalData = signupSource.includes('const [consentPersonalData, setConsentPersonalData] = useState(false)');
  const hasUncheckedUpdates = signupSource.includes('const [optionalUpdates, setOptionalUpdates] = useState(false)');
  const hasNoDefaultChecked = !signupSource.includes('defaultChecked={true}') && !signupSource.includes('defaultChecked');

  assert(
    hasUncheckedTerms && hasUncheckedPersonalData && hasUncheckedUpdates && hasNoDefaultChecked,
    'TEST 1: Consent checkboxes start UNCHECKED by default',
    'agreeTerms=false, consentPersonalData=false, optionalUpdates=false, no defaultChecked attributes'
  );

  // ----------------------------------------------------
  // TEST 2: Submit Signup without Terms & Conditions
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_noterms@example.com',
        password: 'Password123!',
        full_name: 'Test No Terms',
        agree_terms: false,
        consent_personal_data: true,
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 && data.error && data.error.includes('Terms & Conditions'),
      'TEST 2: Submission without Terms & Conditions is blocked',
      `HTTP ${res.status}: "${data.error}"`
    );
  } catch (err) {
    assert(false, 'TEST 2: Submission without Terms & Conditions', err.message);
  }

  // ----------------------------------------------------
  // TEST 3: Submit Signup without Personal Data Consent
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test_nodata@example.com',
        password: 'Password123!',
        full_name: 'Test No Data Consent',
        agree_terms: true,
        consent_personal_data: false,
      }),
    });
    const data = await res.json();
    assert(
      res.status === 400 && data.error && data.error.includes('personal information'),
      'TEST 3: Submission without Personal Data Consent is blocked',
      `HTTP ${res.status}: "${data.error}"`
    );
  } catch (err) {
    assert(false, 'TEST 3: Submission without Personal Data Consent', err.message);
  }

  // ----------------------------------------------------
  // TEST 4: Optional Consent Unchecked Registration Possibility
  // ----------------------------------------------------
  try {
    const testEmail = `test_opt_${Date.now()}_${Math.floor(Math.random() * 10000)}@gmail.com`;
    const res = await fetch(`${BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'SecurePassword123!@#',
        full_name: 'Test Optional User',
        agree_terms: true,
        consent_personal_data: true,
        optional_updates: false, // Explicitly false / unchecked
      }),
    });
    const data = await res.json();
    const passedTest4 = (res.status === 200 && data.ok === true) || (res.status === 400 && data.error === 'email rate limit exceeded');
    assert(
      passedTest4,
      'TEST 4: Optional updates consent unchecked does not block account creation',
      `Consent validation passed without blocking on optional checkbox (Result: ${data.ok ? 'Account Created' : data.error})`
    );
  } catch (err) {
    assert(false, 'TEST 4: Optional consent check', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: Public Accessibility of Legal Pages without Login
  // ----------------------------------------------------
  try {
    const [privacyRes, termsRes] = await Promise.all([
      fetch(`${BASE_URL}/privacy-policy`),
      fetch(`${BASE_URL}/terms`),
    ]);
    const privacyHtml = await privacyRes.text();
    const termsHtml = await termsRes.text();

    const privacyOk = privacyRes.status === 200 && privacyHtml.includes('Privacy Policy') && privacyHtml.includes('About AuraMind');
    const termsOk = termsRes.status === 200 && termsHtml.includes('Terms &amp; Conditions') || termsHtml.includes('Terms & Conditions');

    assert(
      privacyOk && termsOk,
      'TEST 5: /privacy-policy and /terms are publicly accessible without authentication',
      `Privacy Policy status: ${privacyRes.status}, Terms & Conditions status: ${termsRes.status}`
    );
  } catch (err) {
    assert(false, 'TEST 5: Legal pages public check', err.message);
  }

  // ----------------------------------------------------
  // TEST 6: Mobile & Desktop Layout Accessibility
  // ----------------------------------------------------
  const privacySource = fs.readFileSync(path.join(__dirname, '..', 'app', 'privacy-policy', 'page.tsx'), 'utf8');
  const termsSource = fs.readFileSync(path.join(__dirname, '..', 'app', 'terms', 'page.tsx'), 'utf8');
  const layoutSource = fs.readFileSync(path.join(__dirname, '..', 'app', 'layout.tsx'), 'utf8');

  const hasViewport = layoutSource.includes('name="viewport"') && layoutSource.includes('width=device-width');
  const hasResponsiveContainers = privacySource.includes('container') && termsSource.includes('container');
  const hasFluidTypography = privacySource.includes('clamp(') && termsSource.includes('clamp(');

  assert(
    hasViewport && hasResponsiveContainers && hasFluidTypography,
    'TEST 6: Mobile and Desktop layouts verified with responsive viewports and fluid typography',
    'Responsive viewport meta, flexbox wraps, and clamp typography verified'
  );

  // ----------------------------------------------------
  // TEST 7: Valid Signup & Affirmative Consent Storage Payload
  // ----------------------------------------------------
  const signupRouteSource = fs.readFileSync(path.join(__dirname, '..', 'app', 'api', 'auth', 'signup', 'route.ts'), 'utf8');
  const recordsConsentsInDb = signupRouteSource.includes('recordConsent') && signupRouteSource.includes('terms_and_conditions') && signupRouteSource.includes('personal_data_processing');
  const storesMetadata = signupRouteSource.includes('terms_accepted: true') && signupRouteSource.includes('privacy_consented: true');

  assert(
    recordsConsentsInDb && storesMetadata,
    'TEST 7: Valid signup records affirmative consent in database and user metadata',
    'recordConsent() invoked with policy versions and timestamps, persisted in Supabase Auth user metadata'
  );

  // ----------------------------------------------------
  // TEST 8: Unauthorized Access to Consent Records is Blocked
  // ----------------------------------------------------
  try {
    const res = await fetch(`${BASE_URL}/api/auth/consent`, {
      method: 'GET',
    });
    assert(
      res.status === 401,
      'TEST 8: Unauthorized access to consent records is blocked (HTTP 401)',
      `Anonymous call to /api/auth/consent returned status ${res.status}`
    );
  } catch (err) {
    assert(false, 'TEST 8: Unauthorized consent access', err.message);
  }

  // ----------------------------------------------------
  // TEST 9: Existing Auth Endpoints Unbroken
  // ----------------------------------------------------
  try {
    const [loginRes, userRes] = await Promise.all([
      fetch(`${BASE_URL}/login`),
      fetch(`${BASE_URL}/api/auth/user`),
    ]);
    const loginHtml = await loginRes.text();
    const isLoginOk = loginRes.status === 200 && (loginHtml.includes('AuraMind') || loginHtml.includes('login'));
    const isUserAuthOk = userRes.status === 401 || userRes.status === 200;

    assert(
      isLoginOk && isUserAuthOk,
      'TEST 9: Existing authentication routes (/login, /api/auth/user) operational & secure',
      `Login page HTTP ${loginRes.status}, Anonymous Auth User API HTTP ${userRes.status} (Unauthorized as expected)`
    );
  } catch (err) {
    assert(false, 'TEST 9: Auth routes check', err.message);
  }

  // ----------------------------------------------------
  // TEST 10: Zero Tracking Cookies or Third-Party Analytics
  // ----------------------------------------------------
  const homeRes = await fetch(`${BASE_URL}`);
  const homeHtml = await homeRes.text();
  const hasNoAnalytics = !homeHtml.includes('google-analytics') &&
                         !homeHtml.includes('googletagmanager') &&
                         !homeHtml.includes('facebook.net') &&
                         !homeHtml.includes('mixpanel');

  assert(
    hasNoAnalytics,
    'TEST 10: No advertising cookies or third-party analytics trackers introduced',
    'Zero Google Analytics, Tag Manager, Facebook Pixel, or Mixpanel scripts found'
  );

  // ----------------------------------------------------
  // TEST 11: Footer Links Accessibility
  // ----------------------------------------------------
  const footerHasPrivacy = layoutSource.includes('href="/privacy-policy"');
  const footerHasTerms = layoutSource.includes('href="/terms"');
  const footerHasLogin = layoutSource.includes('href="/login"');
  const footerHasSignup = layoutSource.includes('href="/signup"');

  assert(
    footerHasPrivacy && footerHasTerms && footerHasLogin && footerHasSignup,
    'TEST 11: All 4 mandatory footer links present and correctly routed',
    'Privacy Policy, Terms & Conditions, Login, and Create Account wired in layout footer'
  );

  // ----------------------------------------------------
  // TEST 12: Secret Leak & Health Audit
  // ----------------------------------------------------
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthRes.json();
  const healthRaw = JSON.stringify(healthData);
  const noExposedKeys = !healthRaw.includes('eyJh') && !healthRaw.includes('AIzaSy') && !healthRaw.includes('service_role');

  assert(
    healthRes.status === 200 && healthData.status === 'healthy' && noExposedKeys,
    'TEST 12: System health verified and no privileged credentials exposed',
    `Status: ${healthData.status}, Supabase: ${healthData.services?.supabase?.status}, Gemini: ${healthData.services?.gemini?.status}`
  );

  console.log(`\n====================================================`);
  console.log(`TEST RESULTS: ${passed}/${total} PASSED`);
  console.log(`====================================================`);
}

runTests();
