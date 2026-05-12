import heroImg from "@/assets/hero-restaurant.jpg";
import { Search, MapPin, Utensils } from "lucide-react";

export function Hero() {
  return (
    <section className="relative min-h-[100vh] flex items-end pb-20 overflow-hidden">
      <img
        src={heroImg}
        alt="Fine dining"
        width={1920}
        height={1280}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-hero" />
      <div className="relative mx-auto max-w-7xl px-6 w-full">
        <div className="max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <span className="hairline w-12" />
            <span className="text-xs tracking-[0.3em] uppercase text-gold">Danh bạ ẩm thực cao cấp</span>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl leading-[1.05] mb-6">
            Khám phá những bàn tiệc <span className="italic text-gradient-gold">đáng nhớ nhất</span> thành phố.
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl mb-10">
            Từ omakase tinh tế, fine dining Pháp đến những steakhouse cổ điển — Maître quy tụ
            những nhà hàng được tuyển chọn kỹ lưỡng, sẵn sàng đón bạn.
          </p>

          {/* Search */}
          <div className="bg-card/80 backdrop-blur-md border border-border rounded-2xl p-2 shadow-elegant">
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_auto] gap-2">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition">
                <Search className="h-4 w-4 text-gold shrink-0" />
                <input
                  placeholder="Tên nhà hàng, món ăn..."
                  className="bg-transparent text-sm outline-none flex-1 placeholder:text-muted-foreground"
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition border-l border-border">
                <Utensils className="h-4 w-4 text-gold shrink-0" />
                <select className="bg-transparent text-sm outline-none flex-1 text-muted-foreground appearance-none cursor-pointer">
                  <option>Loại nhà hàng</option>
                  <option>Fine dining</option>
                  <option>Omakase</option>
                  <option>Steakhouse / Diner</option>
                  <option>Pháp</option>
                  <option>Ý</option>
                  <option>Việt cao cấp</option>
                </select>
              </div>
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-secondary/60 transition border-l border-border">
                <MapPin className="h-4 w-4 text-gold shrink-0" />
                <select className="bg-transparent text-sm outline-none flex-1 text-muted-foreground appearance-none cursor-pointer">
                  <option>Địa điểm</option>
                  <option>Quận 1, TP.HCM</option>
                  <option>Quận 2, TP.HCM</option>
                  <option>Hoàn Kiếm, Hà Nội</option>
                  <option>Tây Hồ, Hà Nội</option>
                  <option>Đà Nẵng</option>
                </select>
              </div>
              <button className="bg-gradient-gold text-primary-foreground font-medium px-8 py-3 rounded-xl hover:shadow-gold transition">
                Tìm kiếm
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mt-8 text-sm text-muted-foreground">
            <span><span className="text-gold font-medium">320+</span> nhà hàng tuyển chọn</span>
            <span><span className="text-gold font-medium">28</span> thành phố</span>
            <span><span className="text-gold font-medium">15.000+</span> thực khách tin dùng</span>
          </div>
        </div>
      </div>
    </section>
  );
}
