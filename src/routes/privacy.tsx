import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Chính sách bảo mật — Maître" },
    { name: "description", content: "Chính sách bảo mật thông tin cá nhân tại Maître." },
  ]}),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="pt-28 pb-20 mx-auto max-w-3xl px-6">
        <ShieldCheck className="h-8 w-8 text-gold mb-4" />
        <h1 className="font-serif text-4xl md:text-5xl">Chính sách bảo mật</h1>
        <p className="text-muted-foreground mt-3">Cập nhật: {new Date().toLocaleDateString("vi-VN")}</p>
        <div className="prose prose-invert mt-10 space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl text-foreground">Thông tin chúng tôi thu thập</h2>
            <p>Họ tên, email, số điện thoại khi bạn đăng ký tài khoản hoặc đặt chỗ/đặt món. Thông tin nhà hàng (logo, ảnh, menu) khi bạn là đối tác.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-foreground">Cách chúng tôi sử dụng</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Xử lý yêu cầu đặt chỗ/đặt món và chuyển tiếp tới nhà hàng.</li>
              <li>Gửi xác nhận, cập nhật trạng thái và bản tin ưu đãi (khi bạn đồng ý).</li>
              <li>Cải thiện chất lượng dịch vụ và bảo mật hệ thống.</li>
            </ul>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-foreground">Chia sẻ dữ liệu</h2>
            <p>Chúng tôi không bán dữ liệu cá nhân. Chỉ chia sẻ với nhà hàng bạn đặt chỗ hoặc các cơ quan có thẩm quyền khi luật yêu cầu.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-foreground">Quyền của bạn</h2>
            <p>Bạn có thể truy cập, chỉnh sửa hoặc xoá thông tin cá nhân trong trang Tài khoản, hoặc liên hệ <a href="mailto:privacy@maitredinner.vn" className="text-gold hover:underline">privacy@maitredinner.vn</a>.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-foreground">Cookie</h2>
            <p>Maître sử dụng cookie cần thiết để duy trì phiên đăng nhập và ghi nhớ tuỳ chọn. Không sử dụng cookie quảng cáo của bên thứ ba.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
