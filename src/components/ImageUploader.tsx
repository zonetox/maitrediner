import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Upload, X, Loader2, ImagePlus, Link2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  bucket: "restaurant-images" | "menu-images";
  folder?: string; // sub-folder under user_id (e.g. restaurantId)
  value?: string | null;
  onChange: (url: string | null) => void;
  aspect?: string; // tailwind aspect class
  label?: string;
}

export function ImageUploader({ bucket, folder, value, onChange, aspect = "aspect-video", label }: Props) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  async function handleFile(file: File) {
    if (!user) return toast.error("Vui lòng đăng nhập lại để tải ảnh");
    if (!file.type.startsWith("image/")) return toast.error("Tệp phải là ảnh (JPG, PNG, WEBP...)");
    if (file.size > 5 * 1024 * 1024) return toast.error("Ảnh tối đa 5MB — vui lòng nén lại");
    setUploading(true);
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    const path = `${user.id}/${folder ? folder + "/" : ""}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
    setUploading(false);
    if (error) {
      console.error("[ImageUploader] upload failed", error);
      return toast.error(`Tải ảnh thất bại: ${error.message}`);
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    onChange(data.publicUrl);
    toast.success("Đã tải ảnh lên");
  }

  function applyUrl() {
    const v = urlInput.trim();
    if (!v) return;
    if (!/^https?:\/\//i.test(v)) return toast.error("URL phải bắt đầu bằng http:// hoặc https://");
    onChange(v);
    setUrlInput("");
    setShowUrl(false);
    toast.success("Đã đặt ảnh từ URL");
  }

  return (
    <div>
      {label && <label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</label>}
      <div className={`mt-2 relative ${aspect} rounded-lg border border-dashed border-border bg-card overflow-hidden group`}>
        {value ? (
          <>
            <img src={value} alt="" className="absolute inset-0 w-full h-full object-cover"
              onError={() => toast.error("Không tải được ảnh — kiểm tra URL hoặc tải ảnh mới")} />
            <button type="button" onClick={() => onChange(null)}
              className="absolute top-2 right-2 h-8 w-8 grid place-items-center rounded-full bg-background/80 backdrop-blur hover:bg-destructive hover:text-destructive-foreground transition">
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-gold hover:border-gold transition">
            {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" />}
            <span className="text-xs">{uploading ? "Đang tải..." : "Bấm để tải ảnh lên"}</span>
            <span className="text-[10px] text-muted-foreground/70">JPG / PNG / WEBP · tối đa 5MB</span>
          </button>
        )}
        {value && (
          <button type="button" onClick={() => inputRef.current?.click()}
            className="absolute bottom-2 right-2 px-3 py-1.5 rounded-full bg-background/80 backdrop-blur text-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
            <Upload className="h-3 w-3" /> Thay
          </button>
        )}
      </div>
      <div className="mt-1.5 flex items-center justify-between text-[11px]">
        <button type="button" onClick={() => setShowUrl((v) => !v)}
          className="text-muted-foreground hover:text-gold inline-flex items-center gap-1 transition">
          <Link2 className="h-3 w-3" /> {showUrl ? "Ẩn" : "Hoặc dán URL ảnh"}
        </button>
        {value && <span className="text-muted-foreground/60 truncate max-w-[60%]" title={value}>{value.slice(0, 40)}...</span>}
      </div>
      {showUrl && (
        <div className="mt-1.5 flex gap-1.5">
          <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), applyUrl())}
            placeholder="https://..."
            className="flex-1 px-2.5 py-1.5 rounded-md bg-background border border-border focus:border-gold outline-none text-xs" />
          <button type="button" onClick={applyUrl}
            className="px-3 py-1.5 rounded-md bg-gold text-primary-foreground text-xs font-medium hover:opacity-90">Đặt</button>
        </div>
      )}
      <input ref={inputRef} type="file" accept="image/*" hidden
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

interface MultiProps {
  bucket: "menu-images";
  folder?: string;
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function MultiImageUploader({ bucket, folder, value, onChange, max = 3 }: MultiProps) {
  const slots = Array.from({ length: max }, (_, i) => value[i] ?? null);
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((url, i) => (
        <ImageUploader
          key={i}
          bucket={bucket}
          folder={folder}
          value={url}
          aspect="aspect-square"
          onChange={(newUrl) => {
            const next = [...value];
            if (newUrl) next[i] = newUrl;
            else next.splice(i, 1);
            onChange(next.filter(Boolean));
          }}
        />
      ))}
    </div>
  );
}
