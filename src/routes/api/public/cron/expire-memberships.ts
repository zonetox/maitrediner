import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Public cron endpoint — flips trial/active memberships to "expired" once their
// trial_ends_at / membership_ends_at has passed. Idempotent; safe to run often.
// Auth: requires `apikey` header matching SUPABASE_PUBLISHABLE_KEY (sent by pg_cron).
export const Route = createFileRoute("/api/public/cron/expire-memberships")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env.SUPABASE_PUBLISHABLE_KEY;
        const provided = request.headers.get("apikey") || request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
        if (!expected || provided !== expected) {
          return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
        }
        try {
          const { data: trials, error: e1 } = await supabaseAdmin
            .from("restaurants")
            .update({ membership_status: "expired" })
            .eq("membership_status", "trial")
            .lt("trial_ends_at", new Date().toISOString())
            .select("id");

          const { data: actives, error: e2 } = await supabaseAdmin
            .from("restaurants")
            .update({ membership_status: "expired" })
            .eq("membership_status", "active")
            .not("membership_ends_at", "is", null)
            .lt("membership_ends_at", new Date().toISOString())
            .select("id");

          if (e1 || e2) {
            return Response.json({ ok: false, error: e1?.message || e2?.message }, { status: 500 });
          }
          return Response.json({
            ok: true,
            expired_trial: trials?.length ?? 0,
            expired_active: actives?.length ?? 0,
            ran_at: new Date().toISOString(),
          });
        } catch (err: any) {
          return Response.json({ ok: false, error: String(err?.message || err) }, { status: 500 });
        }
      },
    },
  },
});
