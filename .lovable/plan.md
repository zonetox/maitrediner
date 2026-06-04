## Mục tiêu

1. Rà soát và hoàn thiện mọi nút/CTA còn dang dở ở 4 khu vực: Trang khách, Partner, Admin, Tài khoản.
2. Cung cấp 2 cách nhập liệu nhà hàng cho 1 người vận hành solo: scrape bằng **Firecrawl** + import **CSV**.

---

## Phần A — Rà soát & hoàn thiện CTA

Tôi sẽ đi từng route, kiểm tra mọi `<Button>` / link / form xem có handler thật chưa, có loading/disabled/toast lỗi chưa. Kết quả sẽ chia 3 nhóm:

- **Sửa ngay**: nút có handler nhưng thiếu loading state / error toast / validation / điều hướng sau khi xong.
- **Hoàn thiện logic**: nút gọi đúng API nhưng UX dở (vd reload trang thay vì cập nhật state, không refresh list sau khi tạo/xoá).
- **Bỏ/ẩn**: nút placeholder không có chức năng — ẩn cho đến khi cần.

Phạm vi quét:

| Khu vực | File chính cần kiểm |
|---|---|
| Trang khách | `index.tsx`, `restaurants.tsx`, `r.$slug.tsx`, `deals.tsx`, `cuisines.$slug.tsx`, `blog*.tsx`, `Newsletter.tsx`, `SiteHeader/Footer` |
| Tài khoản | `auth.tsx`, `reset-password.tsx`, `account.tsx` |
| Partner | `partner.tsx`, `partner.membership.tsx` |
| Admin | `admin.tsx` + `components/admin/*` |

Đầu ra: 1 báo cáo ngắn liệt kê các nút đã sửa + commit code.

---

## Phần B — Công cụ nhập liệu nhà hàng

### B1. Scrape bằng Firecrawl (cho từng website nhà hàng)

Tab mới trong Admin: **Nhập nhà hàng từ URL**.

Luồng:
```text
[Dán URL nhà hàng] → [Scrape (server fn)] → [Xem trước bản nháp] → [Sửa tay] → [Lưu vào DB]
```

Server function `scrapeRestaurant` (admin-only) gọi Firecrawl:
- `formats: ['markdown', 'branding', { type: 'json', schema }]` để lấy:
  - tên, mô tả, địa chỉ, điện thoại, email, giờ mở cửa, social
  - logo, ảnh hero (từ branding)
  - menu (nếu trên cùng trang)
- Trả về JSON đã chuẩn hoá đúng schema bảng `restaurants`.
- Admin xem, chỉnh, bấm **Lưu** → insert vào `restaurants` ở trạng thái `draft` / `trial`.
- Tuỳ chọn: tải ảnh hero về bucket `restaurant-images`.

Yêu cầu: kết nối **Firecrawl** qua connector của Lovable (1 lần).

### B2. Import hàng loạt từ CSV/JSON

Tab Admin: **Import CSV nhà hàng**.

- Upload file `.csv` hoặc dán JSON.
- Hiện preview 5 dòng đầu + map cột (name, slug, address, phone, email, cuisine, description, image_url…).
- Validate bằng Zod, báo dòng lỗi.
- Bấm **Nhập** → bulk insert qua server fn (admin-only, dùng `supabaseAdmin`).
- Có thể kết hợp: CSV chứa cột `website_url` → tuỳ chọn "scrape thêm chi tiết bằng Firecrawl" cho từng dòng.

Mẫu CSV sẽ kèm sẵn để tải.

### B3. Quy trình khuyến nghị cho 1 người vận hành

1. Gom danh sách 50–200 nhà hàng vào Google Sheet (tên + website).
2. Export CSV → import nhanh (B2) để có "khung" tất cả nhà hàng (status = draft, chưa public).
3. Với mỗi nhà hàng có website → bấm "Enrich bằng Firecrawl" để tự điền mô tả/ảnh/menu.
4. Duyệt tay từng cái → đổi status sang `trial`/`active` để hiện ra ngoài.

Ước lượng: ~30 giây/nhà hàng thay vì 10 phút nhập tay.

---

## Phần C — Thứ tự thực thi

1. **Phần A** (rà soát CTA) — làm trước vì là nền tảng đã có.
2. **Connector Firecrawl** — yêu cầu bạn link qua dialog connector (1 cú click).
3. **Phần B1** — scrape 1 URL.
4. **Phần B2** — import CSV + enrich hàng loạt.

---

## Chi tiết kỹ thuật (cho tham khảo)

- Tất cả import logic dùng `createServerFn` + middleware kiểm `has_role(uid, 'admin')`.
- Firecrawl SDK: `@mendable/firecrawl-js`, gọi qua connector gateway của Lovable (không lộ key).
- Bảng `restaurants` đã có sẵn các cột cần thiết (28 cột) — không cần migration mới cho B1/B2 trừ khi muốn thêm cột `source_url` để truy vết.
- Đề xuất thêm 1 cột `source_url text` + `imported_at timestamptz` vào `restaurants` để biết bản ghi nào đến từ scraper.

Bạn duyệt plan này thì tôi bắt đầu Phần A. Nếu muốn đảo thứ tự (làm Phần B trước để có data test) cứ nói.
