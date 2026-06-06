import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Download, Globe, Upload, Loader2, CheckCircle2, XCircle, FileSpreadsheet, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { scrapeRestaurant, importRestaurants } from "@/lib/import.functions";

type Draft = {
  name: string; slug?: string; cuisine_type?: string; city?: string; address?: string;
  phone?: string; email?: string; short_description?: string; cover_image_url?: string;
  price_range?: string; hours?: string; story?: string; source_url?: string;
};

const CSV_HEADERS = [
  "name", "cuisine_type", "city", "address", "phone", "email",
  "short_description", "cover_image_url", "price_range", "hours", "story", "source_url",
];

function parseCSV(text: string): Draft[] {
  const lines: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQuotes = false; }
      else { field += c; }
    } else {
      if (c === '"') inQuotes = true;
      else if (c === ",") { cur.push(field); field = ""; }
      else if (c === "\n") { cur.push(field); lines.push(cur); cur = []; field = ""; }
      else if (c === "\r") { /* ignore */ }
      else { field += c; }
    }
  }
  if (field.length || cur.length) { cur.push(field); lines.push(cur); }
  if (!lines.length) return [];
  const header = lines[0].map((h) => h.trim().toLowerCase());
  return lines.slice(1)
    .filter((row) => row.some((v) => v && v.trim()))
    .map((row) => {
      const obj: any = {};
      header.forEach((h, i) => { if (CSV_HEADERS.includes(h)) obj[h] = (row[i] ?? "").trim() || undefined; });
      return obj as Draft;
    })
    .filter((d) => d.name);
}

export function ImportTab() {
  const scrapeFn = useServerFn(scrapeRestaurant);
  const importFn = useServerFn(importRestaurants);

  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [draft, setDraft] = useState<Draft | null>(null);

  const [csvRows, setCsvRows] = useState<Draft[]>([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ name: string; status: "ok" | "error"; slug?: string; error?: string }[]>([]);

  async function handleScrape() {
    if (!url.trim()) return toast.error("Nhập URL");
    setScraping(true); setDraft(null);
    try {
      const res = await scrapeFn({ data: { url: url.trim() } });
      setDraft({ ...(res as any).draft, source_url: (res as any).source_url });
      toast.success("Đã trích xuất. Kiểm tra & lưu bên dưới.");
    } catch (e: any) {
      toast.error(e?.message ?? "Lỗi scrape");
    } finally { setScraping(false); }
  }

  async function saveSingle() {
    if (!draft?.name) return toast.error("Cần ít nhất tên nhà hàng");
    setImporting(true);
    try {
      const res: any = await importFn({ data: { rows: [draft] } });
      if (res.created > 0) {
        toast.success(`Đã tạo bản nháp · /${res.results[0].slug}`);
        setDraft(null); setUrl("");
      } else {
        toast.error(res.results?.[0]?.error || "Lỗi lưu");
      }
    } catch (e: any) {
      toast.error(e?.message ?? "Lỗi");
    } finally { setImporting(false); }
  }

  function handleCSVUpload(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCSV(String(reader.result || ""));
      if (!rows.length) return toast.error("Không tìm thấy dòng hợp lệ. Cần cột 'name'.");
      setCsvRows(rows); setResults([]);
      toast.success(`Đọc được ${rows.length} dòng. Bấm 'Nhập' để lưu.`);
    };
    reader.readAsText(file, "utf-8");
  }

  async function runCsvImport() {
    if (!csvRows.length) return;
    setImporting(true); setResults([]);
    try {
      // Chia batch 50 để tránh quá lớn
      const batches: Draft[][] = [];
      for (let i = 0; i < csvRows.length; i += 50) batches.push(csvRows.slice(i, i + 50));
      const all: any[] = [];
      for (const b of batches) {
        const r: any = await importFn({ data: { rows: b } });
        all.push(...r.results);
      }
      setResults(all);
      const ok = all.filter((r) => r.status === "ok").length;
      const fail = all.length - ok;
      toast.success(`Hoàn tất: ${ok} thành công, ${fail} lỗi`);
      if (ok > 0) setCsvRows([]);
    } catch (e: any) {
      toast.error(e?.message ?? "Lỗi import");
    } finally { setImporting(false); }
  }

  function downloadTemplate() {
    const sample = [
      CSV_HEADERS.join(","),
      `"Maison Saigon","Pháp","TP.HCM","12 Đồng Khởi, Q.1","0901234567","hello@maison.vn","Nhà hàng Pháp giữa lòng Sài Gòn","https://example.com/cover.jpg","₫₫₫₫","11:00 - 22:00","Câu chuyện thương hiệu...","https://maison.vn"`,
    ].join("\n");
    const blob = new Blob([sample], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "restaurants-template.csv";
    a.click();
  }

  const inp = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl flex items-center gap-2"><Sparkles className="h-5 w-5 text-gold" /> Nhập liệu nhà hàng</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Hai cách điền nhanh: <b>quét URL</b> bằng Firecrawl, hoặc <b>tải CSV</b>. Bản ghi tạo ra là nháp (chưa công khai), bạn vào{" "}
          <Link to="/partner" className="text-gold hover:underline">khu vực Partner</Link> để tinh chỉnh và xuất bản.
        </p>
      </div>

      {/* Firecrawl scrape */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <h3 className="font-serif text-lg mb-3 flex items-center gap-2"><Globe className="h-4 w-4 text-gold" /> Quét URL (Firecrawl)</h3>
        <div className="flex gap-2 flex-wrap">
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://nhà-hàng-ví-dụ.vn"
            className={inp + " flex-1 min-w-[280px]"} />
          <button onClick={handleScrape} disabled={scraping}
            className="px-4 py-2 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60">
            {scraping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {scraping ? "Đang trích xuất..." : "Trích xuất"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Hỗ trợ: trang chính thức nhà hàng, Foody, TripAdvisor, blog ẩm thực…</p>

        {draft && (
          <div className="mt-5 grid md:grid-cols-2 gap-3 text-sm">
            {CSV_HEADERS.filter((h) => h !== "source_url").map((k) => (
              <div key={k} className={["short_description", "story", "address"].includes(k) ? "md:col-span-2" : ""}>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">{k}</label>
                {["short_description", "story"].includes(k) ? (
                  <textarea rows={k === "story" ? 4 : 2} value={(draft as any)[k] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [k]: e.target.value } as Draft)} className={inp} />
                ) : (
                  <input value={(draft as any)[k] ?? ""}
                    onChange={(e) => setDraft({ ...draft, [k]: e.target.value } as Draft)} className={inp} />
                )}
              </div>
            ))}
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button onClick={() => setDraft(null)} className="px-4 py-2 rounded-md border border-border text-sm">Huỷ</button>
              <button onClick={saveSingle} disabled={importing}
                className="px-4 py-2 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {importing ? "Đang lưu..." : "Lưu nháp"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CSV import */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between flex-wrap gap-2 mb-3">
          <h3 className="font-serif text-lg flex items-center gap-2"><FileSpreadsheet className="h-4 w-4 text-gold" /> Nhập hàng loạt từ CSV</h3>
          <button onClick={downloadTemplate} className="text-xs px-3 py-1.5 rounded-md border border-border inline-flex items-center gap-1 hover:border-gold">
            <Download className="h-3 w-3" /> Tải mẫu CSV
          </button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Cột bắt buộc: <code className="text-gold">name</code>. Cột tuỳ chọn: {CSV_HEADERS.slice(1).join(", ")}.
        </p>
        <label className="block">
          <input type="file" accept=".csv,text/csv" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSVUpload(f); e.target.value = ""; }}
            className="block text-sm text-muted-foreground file:mr-3 file:px-4 file:py-2 file:rounded-md file:border-0 file:bg-gold/15 file:text-gold file:cursor-pointer hover:file:bg-gold/25" />
        </label>

        {csvRows.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm">Sẵn sàng nhập <b className="text-gold">{csvRows.length}</b> nhà hàng</span>
              <button onClick={runCsvImport} disabled={importing}
                className="px-4 py-2 rounded-md bg-gradient-gold text-primary-foreground text-sm font-medium inline-flex items-center gap-2 disabled:opacity-60">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? "Đang nhập..." : "Nhập tất cả"}
              </button>
            </div>
            <div className="rounded-md border border-border max-h-60 overflow-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 text-muted-foreground">
                  <tr><th className="text-left px-3 py-2">Tên</th><th className="text-left px-3 py-2">Thành phố</th><th className="text-left px-3 py-2">Loại</th></tr>
                </thead>
                <tbody>
                  {csvRows.slice(0, 50).map((r, i) => (
                    <tr key={i} className="border-t border-border">
                      <td className="px-3 py-1.5">{r.name}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.city || "—"}</td>
                      <td className="px-3 py-1.5 text-muted-foreground">{r.cuisine_type || "—"}</td>
                    </tr>
                  ))}
                  {csvRows.length > 50 && (
                    <tr><td colSpan={3} className="px-3 py-2 text-center text-muted-foreground">… và {csvRows.length - 50} dòng nữa</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {results.length > 0 && (
          <div className="mt-4 space-y-1 text-xs max-h-60 overflow-auto">
            {results.map((r, i) => (
              <div key={i} className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${r.status === "ok" ? "bg-emerald-500/10 text-emerald-300" : "bg-destructive/10 text-destructive"}`}>
                {r.status === "ok" ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                <span className="flex-1 truncate">{r.name}</span>
                <span className="font-mono opacity-70">{r.status === "ok" ? `/${r.slug}` : r.error}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
