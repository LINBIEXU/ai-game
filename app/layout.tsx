import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "失落航星原型",
  description: "一个 AI 启蒙互动冒险最小原型"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
