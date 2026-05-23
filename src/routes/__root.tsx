import { Toaster } from "sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  ScriptOnce,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-serif text-gold">404</h1>
        <h2 className="mt-4 font-serif text-xl">Không tìm thấy trang</h2>
        <Link to="/" className="mt-6 inline-block px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">Về trang chủ</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-serif text-2xl">Đã có lỗi xảy ra</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }}
          className="mt-6 px-6 py-3 rounded-full bg-gradient-gold text-primary-foreground font-medium">Thử lại</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Gourmet — Thế giới nhà hàng cao cấp" },
      { property: "og:title", content: "Gourmet — Thế giới nhà hàng cao cấp" },
      { name: "twitter:title", content: "Gourmet — Thế giới nhà hàng cao cấp" },
      { name: "description", content: "Trải nghiệm ẩm thực tinh tế từ hàng ngàn nhà hàng cap cấp." },
      { property: "og:description", content: "Trải nghiệm ẩm thực tinh tế từ hàng ngàn nhà hàng cap cấp." },
      { name: "twitter:description", content: "Trải nghiệm ẩm thực tinh tế từ hàng ngàn nhà hàng cap cấp." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/69bbafdc-7cff-4d5b-bbbd-058f52f0aea9/id-preview-e6d70124--d861710f-f1db-49e6-a212-50fbd6f82f0a.lovable.app-1778668957486.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/69bbafdc-7cff-4d5b-bbbd-058f52f0aea9/id-preview-e6d70124--d861710f-f1db-49e6-a212-50fbd6f82f0a.lovable.app-1778668957486.png" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Inter:wght@300;400;500;600;700&display=swap&subset=vietnamese",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

const themeScript = `(function(){try{var t=localStorage.getItem("maison-theme");if(t&&t!=="gold")document.documentElement.setAttribute("data-theme",t);}catch(e){}})();`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head><HeadContent /></head>
      <body><ScriptOnce>{themeScript}</ScriptOnce>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster theme="dark" position="top-center" />
    </QueryClientProvider>
  );
}
