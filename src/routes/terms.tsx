import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ScrollText } from "lucide-react";

export const Route = createFileRoute("/terms")({
  head: () => ({ meta: [
    { title: "Điều khoản sử dụng — Maître" },
    { name: "description", content: "Điều khoản sử dụng nền tảng danh bạ nhà hàng cao cấp Maître." },
  ]}),
  component: TermsPage,
});

function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main className="pt-28 pb-20 mx-auto max-w-3xl px-6">
        <ScrollText className="h-8 w-8 text-gold mb-4" />
        <h1 className="font-serif text-4xl md:text-5xl">Điều khoản sử dụng</h1>
        <p className="text-muted-foreground mt-3">Cập nhật: {new Date().toLocaleDateString("vi-VN")}</p>
        <div className="prose prose-invert mt-10 space-y-6 text-muted-foreground leading-relaxed">
          <section>
            <h2 className="font-serif text-2xl text-foreground">1. Giới thiệu</h2>
            <p>Maître là nền tảng danh bạ trực tuyến giới thiệu các nhà hàng cao cấp tại Việt Nam. Bằng việc sử dụng Maître, bạn đồng ý với các điều khoản dưới đây.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-foreground">2. Tài khoản người dùng</h2>
            <p>Bạn chịu trách nhiệm bảo mật tài khoản và mật khẩu của mình. Mọi hoạt động dưới tài khoản đều được xem là do bạn thực hiện.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-foreground">3. Tài khoản nhà hàng đối tác</h2>
            <p>Nhà hàng đăng ký trên Maître được sử dụng miễn phí 30 ngày dùng thử. Sau thời gian này, cần thanh toán gói thành viên để tiếp tục đăng tải nội dung và nhận đặt chỗ/đặt món.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-foreground">4. Đặt chỗ & đặt món</h2>
            <p>Maître chỉ chuyển tiếp thông tin đặt chỗ/đặt món tới nhà hàng. Nhà hàng chịu trách nhiệm xác nhận, cung cấp dịch vụ và xử lý mọi tranh chấp liên quan.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-foreground">5. Nội dung</h2>
            <p>Mọi nội dung do nhà hàng đăng tải (hình ảnh, mô tả, menu) phải hợp pháp và không vi phạm bản quyền. Maître có quyền gỡ bỏ nội dung vi phạm mà không cần báo trước.</p>
          </section>
          <section>
            <h2 className="font-serif text-2xl text-foreground">6. Liên hệ</h2>
            <p>Mọi thắc mắc xin gửi về: <a href="mailto:hello@maitredinner.vn" className="text-gold hover:underline">hello@maitredinner.vn</a>.</p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
