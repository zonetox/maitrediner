import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Public cron endpoint — flips trial/active memberships to "expired" once their
// trial_ends_at / membership_ends_at has passed. Idempotent; safe to run often.
export const Route = createFileRoute("/api/public/cron/expire-memberships")({
  server: {
    handlers: {
      POST: handler,
      GET: handler,
    },
  },
});

async function handler() {
  try {
    // Trial expired
    const { data: trials, error: e1 } = await supabaseAdmin
      .from("restaurants")
      .update({ membership_status: "expired" })
      .eq("membership_status", "trial")
      .lt("trial_ends_at", new Date().toISOString())
      .select("id");

    // Active expired (only when membership_ends_at is set and in the past)
    const { data: actives, error: e2 } = await supabaseAdmin
      .from("restaurants")
      .update({ membership_status: "expired" })
      .eq("membership_status", "active")
      .not("membership_ends_at", "is", null)
      .lt("membership_ends_at", new Date().toISOString())
      .select("id");

    if (e1 || e2) {
      return Response.json(
        { ok: false, error: e1?.message || e2?.message },
        { status: 500 },
      );
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
}
