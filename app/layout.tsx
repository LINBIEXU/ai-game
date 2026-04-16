import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "失落航星原型",
  description: "一个面向 9-14 岁孩子的 AI 启蒙互动冒险最小原型"
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
