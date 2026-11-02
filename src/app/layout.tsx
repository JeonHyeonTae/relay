import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Toast } from "@/components/layout/toast";
import { Topbar } from "@/components/layout/topbar";
import { DemoProvider } from "@/lib/demo-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Relay",
  description: "모든 소통을 회사 자산으로 — 릴레이 데모",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="antialiased">
        <DemoProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex min-w-0 flex-1 flex-col">
              <Topbar />
              <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
            </div>
          </div>
          <Toast />
        </DemoProvider>
      </body>
    </html>
  );
}
