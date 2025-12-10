
import type { Metadata } from "next";
import "./globals.css";
import InitProvider from './components/InitProvider';
import AuthGuard from "./components/AuthGuard";
import Logo from './components/Logo'; // 新增

export const metadata: Metadata = {
  title: "0907 Wallet",
  description: "Secure local wallet",
  icons: {
    icon: "/favicon.ico?v=2", // 或数组支持不同尺寸
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Font Awesome Kit */}
        <script
          src="https://kit.fontawesome.com/3184ed98f6.js"
          crossOrigin="anonymous"
          async
        ></script>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <InitProvider>
          <AuthGuard>

            <Logo />
            {children}

          </AuthGuard>
        </InitProvider>
      </body>
    </html>
  );
}
