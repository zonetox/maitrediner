import { Mail } from "lucide-react";

export function Newsletter() {
  return (
    <section className="py-24 border-t border-border">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <Mail className="h-8 w-8 text-gold mx-auto mb-6" />
        <span className="text-xs tracking-[0.3em] uppercase text-gold">La Carte</span>
        <h2 className="font-serif text-4xl md:text-5xl mt-3 mb-5">
          Nhận ưu đãi sớm từ <span className="italic text-gradient-gold">những bếp trưởng</span> bạn yêu thích
        </h2>
        <p className="text-muted-foreground max-w-xl mx-auto mb-10">
          Mỗi tuần một bản tin ngắn: nhà hàng mới, set menu giới hạn, sự kiện riêng tư — gửi thẳng vào hộp thư.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto" onSubmit={(e) => e.preventDefault()}>
          <input
            type="email"
            placeholder="email@cua-ban.com"
            className="flex-1 px-5 py-4 rounded-full bg-card border border-border focus:border-gold outline-none text-sm"
          />
          <button className="px-8 py-4 rounded-full bg-gradient-gold text-primary-foreground font-medium hover:shadow-gold transition">
            Đăng ký
          </button>
        </form>
        <p className="text-xs text-muted-foreground mt-4">Chúng tôi tôn trọng quyền riêng tư của bạn. Hủy đăng ký bất cứ lúc nào.</p>
      </div>
    </section>
  );
}
