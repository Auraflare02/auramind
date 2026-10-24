import { db } from "../lib/db";

async function main() {
  try {
    const client = db();
    const result = await client.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://auramind-vert.vercel.app/auth/callback",
      },
    });
    console.log("OAuth result:", result);
  } catch (err: any) {
    console.error("OAuth error:", err);
  }
}

main();
