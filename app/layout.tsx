import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { ChatbotDrawer } from "@/components/chat/chatbot-drawer";
import { AuthProvider } from "@/lib/auth/auth-context";
import { AdminLoginModal } from "@/components/auth/admin-login-modal";

const plusJakartaSans = Plus_Jakarta_Sans({ variable: "--font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const jetbrainsMono = JetBrains_Mono({ variable: "--font-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "MaishaWatch — Equipment Intelligence",
  description: "Medical equipment utilization and maintenance risk monitoring for Kenyan county hospitals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <AdminLoginModal />
            <ChatbotDrawer />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

