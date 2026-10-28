import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;
const STATE_MAX_AGE_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Derives a consistent 32-byte key for AES-256 from environment variables.
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.CALENDAR_ENCRYPTION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET ||
    "auramind-calendar-encryption-fallback-key-2026";

  return crypto.createHash("sha256").update(secret).digest();
}

/**
 * Encrypts a sensitive plaintext string (e.g., OAuth refresh token) using AES-256-GCM.
 * Output format: <hex_iv>:<hex_auth_tag>:<hex_ciphertext>
 */
export function encryptToken(plaintext: string): string {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty string.");
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 */
export function decryptToken(encryptedData: string): string {
  if (!encryptedData) {
    throw new Error("Cannot decrypt empty string.");
  }

  const parts = encryptedData.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted token format.");
  }

  const [ivHex, authTagHex, cipherHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

/**
 * Generates a tamper-proof, time-bounded CSRF OAuth state parameter.
 */
export function createOAuthState(userId: string, returnUrl: string = "/settings"): string {
  const payload = {
    userId,
    returnUrl,
    ts: Date.now(),
    nonce: crypto.randomBytes(16).toString("hex"),
  };

  const json = JSON.stringify(payload);
  const encodedPayload = Buffer.from(json, "utf8").toString("base64url");

  const hmac = crypto.createHmac("sha256", getEncryptionKey());
  hmac.update(encodedPayload);
  const signature = hmac.digest("base64url");

  return `${encodedPayload}.${signature}`;
}

/**
 * Validates and decodes the OAuth state parameter.
 */
export function verifyOAuthState(stateStr: string): {
  valid: boolean;
  userId?: string;
  returnUrl?: string;
  error?: string;
} {
  try {
    if (!stateStr || !stateStr.includes(".")) {
      return { valid: false, error: "Malformed OAuth state parameter." };
    }

    const [encodedPayload, signature] = stateStr.split(".");
    const hmac = crypto.createHmac("sha256", getEncryptionKey());
    hmac.update(encodedPayload);
    const expectedSig = hmac.digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false, error: "OAuth state signature mismatch (possible CSRF attack)." };
    }

    const json = Buffer.from(encodedPayload, "base64url").toString("utf8");
    const payload = JSON.parse(json);

    if (Date.now() - payload.ts > STATE_MAX_AGE_MS) {
      return { valid: false, error: "OAuth state has expired. Please initiate the connection again." };
    }

    return {
      valid: true,
      userId: payload.userId,
      returnUrl: payload.returnUrl || "/settings",
    };
  } catch (err: any) {
    return { valid: false, error: `Invalid state decoding: ${err.message}` };
  }
}

/**
 * Computes a hash for task details to detect whether an event needs updating.
 */
export function computeEventHash(details: {
  activity: string;
  start: string;
  end: string;
  date: string;
  category?: string;
}): string {
  const content = `${details.date}|${details.start}|${details.end}|${details.activity.trim()}|${details.category || ""}`;
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}
