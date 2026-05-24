import { UtensilsCrossed, Instagram, Facebook, Youtube, Music2 } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { SmartLink } from "@/components/SmartLink";

const ICON_MAP = {
  instagram: Instagram,
  facebook: Facebook,
  youtube: Youtube,
  tiktok: Music2,
} as const;

export function SiteFooter() {
  const s = useSiteSettings();
  const year = new Date().getFullYear();
  const copyright = s.copyright.replace("{year}", String(year));
  const socials = Object.entries(s.socials ?? {}).filter(([, v]) => v && String(v).trim().length > 0);

  return (
    <footer className="border-t border-border pt-20 pb-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <UtensilsCrossed className="h-5 w-5 text-gold" />
              <span className="font-serif text-xl">
                {s.brand_name}<span className="text-gold">.</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.brand_tagline}</p>
          </div>

          {s.footer_columns.slice(0, 2).map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-medium mb-4 text-gold">{col.title}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <SmartLink to={l.to} className="hover:text-gold">{l.label}</SmartLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <h4 className="text-sm font-medium mb-4 text-gold">Theo dõi</h4>
            <div className="flex gap-3">
              {socials.length === 0 && (
                <p className="text-xs text-muted-foreground">Chưa cấu hình mạng xã hội.</p>
              )}
              {socials.map(([key, url]) => {
                const Icon = (ICON_MAP as any)[key] ?? Instagram;
                return (
                  <a key={key} href={url as string} target="_blank" rel="noreferrer noopener" aria-label={key}
                    className="h-10 w-10 rounded-full border border-border grid place-items-center hover:border-gold hover:text-gold transition">
                    <Icon className="h-4 w-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
        <div className="hairline mb-6" />
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>{copyright}</p>
          <div className="flex gap-6">
            {s.bottom_links.map((l) => (
              <SmartLink key={l.label} to={l.to} className="hover:text-gold">{l.label}</SmartLink>
            ))}
            {s.contact_email && (
              <a href={`mailto:${s.contact_email}`} className="hover:text-gold">Liên hệ</a>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}
