import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type NavLink = { label: string; to: string };
export type FooterColumn = { title: string; links: NavLink[] };
export type SiteSettings = {
  brand_name: string;
  brand_tagline: string;
  contact_email: string;
  header_nav: NavLink[];
  footer_columns: FooterColumn[];
  socials: { instagram?: string; facebook?: string; youtube?: string; tiktok?: string };
  copyright: string;
  bottom_links: NavLink[];
};

const DEFAULTS: SiteSettings = {
  brand_name: "Maison Dining",
  brand_tagline:
    "Danh bạ nhà hàng cao cấp tuyển chọn. Khám phá, đặt bàn và tận hưởng những trải nghiệm đáng nhớ.",
  contact_email: "hello@maisondining.com",
  header_nav: [
    { label: "Nhà hàng", to: "/restaurants" },
    { label: "Signature", to: "/signature" },
    { label: "Ưu đãi", to: "/deals" },
    { label: "Gói thành viên", to: "/membership" },
  ],
  footer_columns: [],
  socials: {},
  copyright: "© {year} Maison Dining.",
  bottom_links: [],
};

let cache: SiteSettings | null = null;
let inflight: Promise<SiteSettings> | null = null;
const listeners = new Set<(s: SiteSettings) => void>();

async function fetchOnce(): Promise<SiteSettings> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase.from("site_settings").select("*").eq("id", true).maybeSingle();
    const merged: SiteSettings = { ...DEFAULTS, ...(data as any) };
    cache = merged;
    listeners.forEach((cb) => cb(merged));
    inflight = null;
    return merged;
  })();
  return inflight;
}

export function invalidateSiteSettings() {
  cache = null;
  fetchOnce().then((s) => listeners.forEach((cb) => cb(s)));
}

export function useSiteSettings(): SiteSettings {
  const [s, setS] = useState<SiteSettings>(cache ?? DEFAULTS);
  useEffect(() => {
    listeners.add(setS);
    fetchOnce().then(setS);
    return () => {
      listeners.delete(setS);
    };
  }, []);
  return s;
}
