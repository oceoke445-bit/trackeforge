import type { Metadata } from "next";
import { Inter } from "next/font/google";
import PlatformLayout from "@/components/Layout";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Traxon — Fleet Intelligence",
  description:
    "Monitor GPS-enabled vehicles and assets in real time with a professional IoT tracking platform designed for fleet and security operations teams.",
};

const themeBoot = `(function(){try{var t=localStorage.getItem("traxon-theme");if(t!=="gray"&&t!=="blue")t="blue";document.documentElement.setAttribute("data-theme",t);}catch(e){document.documentElement.setAttribute("data-theme","blue");}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider>
          <PlatformLayout>{children}</PlatformLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
