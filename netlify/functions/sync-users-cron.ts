import { Config, Context } from "@netlify/functions";
import * as admin from "firebase-admin";

/**
 * Netlify Scheduled Function
 * Cron: Every 2 hours (0 */2 * * *)
 */

export default async (req: Request, context: Context) => {
  // Identity-scrubbed: Only aggregate counts logged, no UIDs or emails
  console.log("🚀 Starting Scheduled User Sync...");

  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !FIREBASE_SERVICE_ACCOUNT) {
    console.error("❌ Missing required environment variables.");
    return new Response(JSON.stringify({ error: "Configuration error" }), { status: 500 });
  }

  // Initialize Firebase Admin
  if (admin.apps.length === 0) {
    try {
      const serviceAccount = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (err) {
      console.error("❌ Failed to parse Firebase Service Account:", err);
      return new Response(JSON.stringify({ error: "Firebase Init Error" }), { status: 500 });
    }
  }

  const results = {
    total: 0,
    synced: 0,
    failed: 0,
    errors: [] as string[],
  };

  try {
    let nextPageToken: string | undefined;

    do {
      const listUsersResult = await admin.auth().listUsers(1000, nextPageToken);
      const firebaseUsers = listUsersResult.users;
      results.total += firebaseUsers.length;

      const profiles = firebaseUsers.map((u) => {
        const email = u.email || "";
        const userId = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "") || u.uid.substring(0, 8);
        
        return {
          firebase_uid: u.uid,
          user_id: userId,
          email: email,
          full_name: u.displayName || "",
          photo_url: u.photoURL || "",
          phone_number: u.phoneNumber || "",
          email_verified: u.emailVerified || false,
          disabled: u.disabled || false,
          provider: u.providerData?.[0]?.providerId || "Unknown",
          last_login_at: u.metadata.lastSignInTime || null,
          created_at: u.metadata.creationTime || new Date().toISOString(),
          metadata: {
            customClaims: u.customClaims || {},
            tenantId: (u as any).tenantId || null,
          },
        };
      });

      // Bulk Upsert to Supabase via REST API
      // Using Service Role Key to bypass RLS
      const res = await fetch(`${SUPABASE_URL}/rest/v1/users?on_conflict=firebase_uid`, {
        method: "POST",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          "Prefer": "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(profiles),
      });

      if (!res.ok) {
        const errorText = await res.text();
        results.failed += profiles.length;
        results.errors.push(`Supabase Upsert Failed: ${errorText}`);
      } else {
        results.synced += profiles.length;
      }

      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);

    console.log(`✅ Sync Complete: ${results.synced}/${results.total} users synced, ${results.failed} failed.`);
    return new Response(JSON.stringify(results), { status: 200 });

  } catch (err: any) {
    console.error("❌ Unexpected Sync Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// Netlify Cron Schedule
export const config: Config = {
  schedule: "0 */2 * * *",
};
