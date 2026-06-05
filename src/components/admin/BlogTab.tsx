import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ImageUploader } from "@/components/ImageUploader";
import { Plus, Trash2, Save, Edit3, Eye, EyeOff, FileText, FolderOpen, X, Search } from "lucide-react";
import { toast } from "sonner";

type Cat = { id: string; name: string; slug: string; description: string | null; sort_order: number; is_active: boolean };
type Post = {
  id: string; title: string; slug: string; excerpt: string | null; content: string;
  cover_image_url: string | null; category_id: string | null; status: "draft" | "published";
  published_at: string | null; seo_title: string | null; seo_description: string | null;
  tags: string[]; reading_minutes: number; author_id: string; updated_at: string;
};

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function BlogTab() {
  const { user } = useAuth();
  const [tab, setTab] = useState<"posts" | "categories">("posts");
  const [cats, setCats] = useState<Cat[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<Post | null>(null);

  async function load() {
    const [{ data: c }, { data: p }] = await Promise.all([
      (supabase as any).from("blog_categories").select("*").order("sort_order"),
      (supabase as any).from("blog_posts").select("*").order("updated_at", { ascending: false }),
    ]);
    setCats(c ?? []); setPosts(p ?? []);
  }
  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab("posts")} className={`px-4 py-2 rounded-md text-sm border ${tab === "posts" ? "border-gold text-gold" : "border-border text-muted-foreground"}`}>
          <FileText className="inline h-3 w-3 mr-1" /> Bài viết ({posts.length})
        </button>
        <button onClick={() => setTab("categories")} className={`px-4 py-2 rounded-md text-sm border ${tab === "categories" ? "border-gold text-gold" : "border-border text-muted-foreground"}`}>
          <FolderOpen className="inline h-3 w-3 mr-1" /> Danh mục ({cats.length})
        </button>
      </div>

      {tab === "categories" && <CategoriesPanel cats={cats} reload={load} />}
      {tab === "posts" && (
        <PostsPanel
          posts={posts}
          cats={cats}
          onEdit={(p) => setEditing(p)}
          onNew={() => setEditing({
            id: "", title: "", slug: "", excerpt: "", content: "", cover_image_url: null,
            category_id: cats[0]?.id ?? null, status: "draft", published_at: null,
            seo_title: "", seo_description: "", tags: [], reading_minutes: 3,
            author_id: user!.id, updated_at: new Date().toISOString(),
          })}
          reload={load}
        />
      )}

      {editing && (
        <PostEditor
          post={editing}
          cats={cats}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function CategoriesPanel({ cats, reload }: { cats: Cat[]; reload: () => void }) {
  const [newCat, setNewCat] = useState({ name: "", description: "" });
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Cat>>({});

  async function add() {
    if (!newCat.name.trim()) return;
    const { error } = await (supabase as any).from("blog_categories").insert({
      name: newCat.name.trim(), slug: slugify(newCat.name), description: newCat.description || null,
      sort_order: cats.length + 1,
    });
    if (error) return toast.error(error.message);
    setNewCat({ name: "", description: "" }); reload();
    toast.success("Đã thêm danh mục");
  }
  async function remove(id: string) {
    if (!confirm("Xoá danh mục này? Bài viết sẽ bị bỏ liên kết.")) return;
    const { error } = await (supabase as any).from("blog_categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload(); toast.success("Đã xoá");
  }
  async function toggle(c: Cat) {
    const { error } = await (supabase as any).from("blog_categories").update({ is_active: !c.is_active }).eq("id", c.id);
    if (error) return toast.error(error.message);
    reload();
  }
  async function saveEdit() {
    if (!editId) return;
    const { error } = await (supabase as any).from("blog_categories").update({
      name: editForm.name, slug: editForm.slug, description: editForm.description ?? null,
      sort_order: editForm.sort_order ?? 0,
    }).eq("id", editId);
    if (error) return toast.error(error.message);
    setEditId(null); setEditForm({}); reload(); toast.success("Đã cập nhật");
  }

  const ip = "bg-background border border-border rounded-md px-3 py-2 text-sm";
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-serif text-lg mb-4">Danh mục Blog</h3>
      <div className="grid md:grid-cols-[1fr_2fr_auto] gap-2 mb-4">
        <input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
          placeholder="Tên danh mục" className={ip} />
        <input value={newCat.description} onChange={(e) => setNewCat({ ...newCat, description: e.target.value })}
          placeholder="Mô tả ngắn (SEO)" className={ip} />
        <button onClick={add} className="px-4 py-2 rounded-md bg-gradient-gold text-primary-foreground text-sm inline-flex items-center gap-1">
          <Plus className="h-3 w-3" /> Thêm
        </button>
      </div>

      <div className="space-y-2">
        {cats.map((c) => (
          <div key={c.id} className="p-3 rounded-md border border-border bg-card/50">
            {editId === c.id ? (
              <div className="grid md:grid-cols-[1fr_1fr_2fr_80px_auto] gap-2 items-center">
                <input value={editForm.name ?? ""} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className={ip} placeholder="Tên" />
                <input value={editForm.slug ?? ""} onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })} className={ip + " font-mono"} placeholder="slug" />
                <input value={editForm.description ?? ""} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className={ip} placeholder="Mô tả" />
                <input type="number" value={editForm.sort_order ?? 0} onChange={(e) => setEditForm({ ...editForm, sort_order: Number(e.target.value) })} className={ip} />
                <div className="flex gap-1">
                  <button onClick={saveEdit} className="text-xs px-3 py-2 rounded-md bg-gold text-primary-foreground">Lưu</button>
                  <button onClick={() => { setEditId(null); setEditForm({}); }} className="text-xs px-3 py-2 rounded-md border border-border">Huỷ</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="font-medium">{c.name} <span className="text-xs text-muted-foreground font-mono">/{c.slug}</span></div>
                  {c.description && <div className="text-xs text-muted-foreground mt-0.5">{c.description}</div>}
                </div>
                <button onClick={() => toggle(c)} title={c.is_active ? "Đang hiển thị" : "Đã ẩn"}>
                  {c.is_active ? <Eye className="h-4 w-4 text-gold" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </button>
                <button onClick={() => { setEditId(c.id); setEditForm(c); }} className="text-muted-foreground hover:text-gold">
                  <Edit3 className="h-4 w-4" />
                </button>
                <button onClick={() => remove(c.id)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        ))}
        {cats.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Chưa có danh mục blog nào.</p>}
      </div>
    </div>
  );
}

function PostsPanel({ posts, cats, onEdit, onNew, reload }: {
  posts: Post[]; cats: Cat[]; onEdit: (p: Post) => void; onNew: () => void; reload: () => void;
}) {
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "draft">("all");
  const [catFilter, setCatFilter] = useState<string>("all");

  async function remove(id: string) {
    if (!confirm("Xoá bài viết này? Hành động không thể hoàn tác.")) return;
    const { error } = await (supabase as any).from("blog_posts").delete().eq("id", id);
    if (error) return toast.error(error.message);
    reload(); toast.success("Đã xoá");
  }
  async function togglePublish(p: Post) {
    const newStatus = p.status === "published" ? "draft" : "published";
    const { error } = await (supabase as any).from("blog_posts").update({
      status: newStatus,
      published_at: newStatus === "published" ? (p.published_at ?? new Date().toISOString()) : p.published_at,
    }).eq("id", p.id);
    if (error) return toast.error(error.message);
    reload();
  }
  async function duplicate(p: Post) {
    const newSlug = `${p.slug}-copy-${Date.now().toString(36)}`;
    const { error } = await (supabase as any).from("blog_posts").insert({
      title: p.title + " (bản sao)", slug: newSlug, excerpt: p.excerpt, content: p.content,
      cover_image_url: p.cover_image_url, category_id: p.category_id, status: "draft",
      seo_title: p.seo_title, seo_description: p.seo_description, tags: p.tags,
      reading_minutes: p.reading_minutes, author_id: p.author_id,
    });
    if (error) return toast.error(error.message);
    reload(); toast.success("Đã nhân bản");
  }

  const filtered = posts.filter((p) => {
    if (statusFilter !== "all" && p.status !== statusFilter) return false;
    if (catFilter !== "all" && p.category_id !== catFilter) return false;
    if (q.trim()) {
      const hay = `${p.title} ${p.slug} ${p.excerpt ?? ""} ${(p.tags ?? []).join(" ")}`.toLowerCase();
      if (!hay.includes(q.trim().toLowerCase())) return false;
    }
    return true;
  });

  const stats = {
    total: posts.length,
    published: posts.filter((p) => p.status === "published").length,
    draft: posts.filter((p) => p.status === "draft").length,
  };
  const ip = "bg-background border border-border rounded-md px-3 py-2 text-sm";

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Tổng bài</div>
          <div className="font-serif text-2xl mt-1">{stats.total}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Đã xuất bản</div>
          <div className="font-serif text-2xl mt-1 text-emerald-400">{stats.published}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-xs text-muted-foreground">Bản nháp</div>
          <div className="font-serif text-2xl mt-1 text-gold">{stats.draft}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm theo tiêu đề, slug, tag…" className={ip + " pl-9 w-full"} />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className={ip}>
          <option value="all">Tất cả trạng thái</option>
          <option value="published">Đã xuất bản</option>
          <option value="draft">Nháp</option>
        </select>
        <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className={ip}>
          <option value="all">Tất cả danh mục</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <button onClick={onNew} disabled={cats.length === 0} className="px-4 py-2 rounded-md bg-gradient-gold text-primary-foreground text-sm inline-flex items-center gap-1 disabled:opacity-50">
          <Plus className="h-3 w-3" /> Bài viết mới
        </button>
      </div>
      {cats.length === 0 && (
        <p className="text-xs text-gold mb-3">⚠ Tạo ít nhất một danh mục trước khi viết bài.</p>
      )}
      <div className="rounded-2xl border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground uppercase tracking-wider">
            <tr className="border-b border-border">
              {["Tiêu đề", "Danh mục", "Trạng thái", "Xuất bản", "Cập nhật", ""].map((h) => (
                <th key={h} className="text-left font-medium px-4 py-3">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const cat = cats.find((c) => c.id === p.category_id);
              return (
                <tr key={p.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <div className="font-medium">{p.title}</div>
                    <div className="text-xs text-muted-foreground font-mono">/{p.slug}</div>
                  </td>
                  <td className="px-4 text-sm text-muted-foreground">{cat?.name ?? "—"}</td>
                  <td className="px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${p.status === "published" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-muted text-muted-foreground border-border"}`}>
                      {p.status === "published" ? "Đã xuất bản" : "Nháp"}
                    </span>
                  </td>
                  <td className="px-4 text-xs text-muted-foreground">{p.published_at ? new Date(p.published_at).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className="px-4 text-xs text-muted-foreground">{new Date(p.updated_at).toLocaleDateString("vi-VN")}</td>
                  <td className="px-4">
                    <div className="flex gap-2 justify-end items-center">
                      <button onClick={() => togglePublish(p)} title={p.status === "published" ? "Chuyển về nháp" : "Xuất bản"}>
                        {p.status === "published" ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-gold" />}
                      </button>
                      {p.status === "published" && (
                        <Link to="/blog/$slug" params={{ slug: p.slug }} target="_blank" className="text-xs text-gold">Xem</Link>
                      )}
                      <button onClick={() => duplicate(p)} title="Nhân bản" className="text-muted-foreground hover:text-gold">
                        <FileText className="h-4 w-4" />
                      </button>
                      <button onClick={() => onEdit(p)} className="text-muted-foreground hover:text-gold"><Edit3 className="h-4 w-4" /></button>
                      <button onClick={() => remove(p.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted-foreground">
                {posts.length === 0 ? "Chưa có bài viết nào." : "Không có bài viết phù hợp bộ lọc."}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PostEditor({ post, cats, onClose, onSaved }: {
  post: Post; cats: Cat[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<Post>(post);
  const [saving, setSaving] = useState(false);
  const isNew = !post.id;

  async function save(publish?: boolean) {
    if (!form.title.trim()) return toast.error("Nhập tiêu đề");
    const slug = form.slug.trim() || slugify(form.title);
    const status = publish ? "published" : form.status;
    const payload: any = {
      title: form.title.trim(),
      slug,
      excerpt: form.excerpt || null,
      content: form.content,
      cover_image_url: form.cover_image_url,
      category_id: form.category_id,
      status,
      published_at: status === "published" ? (form.published_at ?? new Date().toISOString()) : form.published_at,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      tags: form.tags,
      reading_minutes: form.reading_minutes || 3,
      author_id: form.author_id,
    };
    setSaving(true);
    const { error } = isNew
      ? await (supabase as any).from("blog_posts").insert(payload)
      : await (supabase as any).from("blog_posts").update(payload).eq("id", post.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(publish ? "Đã xuất bản" : "Đã lưu");
    onSaved();
  }

  const ip = "w-full bg-background border border-border rounded-md px-3 py-2 text-sm";
  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-screen p-4">
        <div className="max-w-5xl mx-auto bg-card border border-border rounded-2xl">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-card rounded-t-2xl z-10">
            <h2 className="font-serif text-xl">{isNew ? "Bài viết mới" : "Sửa bài viết"}</h2>
            <div className="flex gap-2">
              <button onClick={() => save(false)} disabled={saving} className="px-4 py-2 rounded-md border border-border text-sm inline-flex items-center gap-1 disabled:opacity-60">
                <Save className="h-3 w-3" /> {saving ? "Đang lưu…" : "Lưu nháp"}
              </button>
              <button onClick={() => save(true)} disabled={saving} className="px-4 py-2 rounded-md bg-gradient-gold text-primary-foreground text-sm inline-flex items-center gap-1 disabled:opacity-60">
                <Eye className="h-3 w-3" /> {saving ? "Đang xử lý…" : form.status === "published" ? "Cập nhật" : "Xuất bản"}
              </button>
              <button onClick={onClose} className="p-2 rounded-md border border-border"><X className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="p-6 grid md:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Tiêu đề *</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: form.slug || slugify(e.target.value) })}
                  className={ip + " text-lg font-serif"} placeholder="Tiêu đề bài viết" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Slug</label>
                <input value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                  className={ip + " font-mono"} placeholder="duong-dan-bai-viet" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Tóm tắt</label>
                <textarea value={form.excerpt ?? ""} onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                  rows={2} className={ip} placeholder="Tóm tắt 1–2 câu hiển thị ở danh sách & mạng xã hội." />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Nội dung (Markdown / HTML đơn giản)</label>
                <textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                  rows={20} className={ip + " font-mono text-xs leading-relaxed"} placeholder="# Tiêu đề H1&#10;&#10;Đoạn văn..." />
                <p className="text-[10px] text-muted-foreground mt-1">Hỗ trợ Markdown cơ bản (#, **, *, [link](url), ![alt](image), &gt; quote, danh sách).</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Ảnh bìa</label>
                <ImageUploader bucket="restaurant-images" folder="blog" value={form.cover_image_url}
                  onChange={(url) => setForm({ ...form, cover_image_url: url })} aspect="aspect-[16/9]" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Danh mục</label>
                <select value={form.category_id ?? ""} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })} className={ip}>
                  <option value="">— Không —</option>
                  {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Thẻ (cách nhau bằng dấu phẩy)</label>
                <input value={form.tags.join(", ")} onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
                  className={ip} placeholder="fine dining, omakase" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground mb-1 block">Thời gian đọc (phút)</label>
                <input type="number" min={1} value={form.reading_minutes} onChange={(e) => setForm({ ...form, reading_minutes: Number(e.target.value) || 3 })} className={ip} />
              </div>
              <div className="pt-4 border-t border-border">
                <div className="text-xs uppercase tracking-wider text-gold mb-2">SEO</div>
                <label className="text-xs text-muted-foreground mb-1 block">Tiêu đề SEO ({(form.seo_title ?? form.title).length}/60)</label>
                <input value={form.seo_title ?? ""} onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  className={ip} placeholder="Để trống dùng tiêu đề bài viết" />
                <label className="text-xs text-muted-foreground mb-1 mt-3 block">Mô tả SEO ({(form.seo_description ?? form.excerpt ?? "").length}/160)</label>
                <textarea value={form.seo_description ?? ""} onChange={(e) => setForm({ ...form, seo_description: e.target.value })}
                  rows={3} className={ip} placeholder="Để trống dùng tóm tắt" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
