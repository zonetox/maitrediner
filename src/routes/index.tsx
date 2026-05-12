import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { Hero } from "@/components/Hero";
import { Categories } from "@/components/Categories";
import { FeaturedRestaurants } from "@/components/FeaturedRestaurants";
import { SignatureDishes } from "@/components/SignatureDishes";
import { Deals } from "@/components/Deals";
import { Newsletter } from "@/components/Newsletter";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Maître — Danh bạ nhà hàng cao cấp tuyển chọn" },
      {
        name: "description",
        content:
          "Khám phá, đặt bàn và lưu ưu đãi tại các nhà hàng fine dining, omakase, steakhouse và bistro hàng đầu Việt Nam.",
      },
      { property: "og:title", content: "Maître — Danh bạ nhà hàng cao cấp" },
      { property: "og:description", content: "Tuyển chọn nhà hàng cao cấp, ưu đãi và đặt bàn." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />
      <main>
        <Hero />
        <Categories />
        <FeaturedRestaurants />
        <SignatureDishes />
        <Deals />
        <Newsletter />
      </main>
      <SiteFooter />
    </div>
  );
}
