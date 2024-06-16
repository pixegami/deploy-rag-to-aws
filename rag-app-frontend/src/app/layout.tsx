"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import { getSessionId } from "@/lib/getUserId";
import Link from "next/link";
import { Code, FileText, Globe, Home, User, Video } from "lucide-react";
import dynamic from "next/dynamic";
import { getApiUrl } from "@/lib/getApiClient";

const inter = Inter({ subsets: ["latin"] });

function InnerLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const userId = getSessionId();
  const truncatedUserId = userId.slice(0, 8);
  console.log("userId", userId);

  return (
    <main className="flex min-h-screen flex-col items-center px-2 lg:px-24 py-8 gap-2">
      <header className="w-full max-w-3xl flex justify-between items-center text-xs">
        <Link href="/">
          <div className="text-slate-600 flex">
            <Home className="my-auto mr-1 h-4 w-4" /> Home
          </div>
        </Link>
        <div className="flex gap-2">
          <div className="bg-slate-300 p-1 rounded-sm text-slate-600 flex">
            <User className="my-auto mr-2 h-4 w-4" /> {truncatedUserId}
          </div>
          <div className="bg-slate-300 p-1 rounded-sm text-slate-600 flex">
            <Globe className="my-auto mr-2 h-4 w-4" /> {getApiUrl()}
          </div>
        </div>
      </header>
      <div className="z-10 w-full max-w-3xl flex flex-col gap-4 items-center justify-between">
        {children}
      </div>
      <footer className="w-full max-w-3xl text-sm text-slate-400 mt-4">
        <div className="text-center space-y-2">
          <div className="flex items-center gap-2 justify-center sm:flex-row flex-col">
            <Link href="https://github.com/pixegami/deploy-rag-to-aws/blob/main/image/src/data/source/galaxy-design-client-guide.pdf">
              <div className="flex hover:underline hover:text-slate-700">
                <FileText className="mr-1 h-4 w-4 my-auto" />
                Source PDF
              </div>
            </Link>
            <Link href="https://github.com/pixegami/deploy-rag-to-aws">
              <div className="flex hover:underline hover:text-slate-700">
                <Code className="mr-1 h-4 w-4 my-auto" />
                Project Source Code
              </div>
            </Link>
            <Link href="https://www.youtube.com/channel/UCuxhTSKtnMJizinblLs9xOA">
              <div className="flex hover:underline hover:text-slate-700">
                <Video className="mr-1 h-4 w-4 my-auto" />
                Watch Video Tutorial
              </div>
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

const DynamicInnerLayout = dynamic(() => Promise.resolve(InnerLayout), {
  ssr: false,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <title>Galaxy Designs: AI Chat</title>
      <body className={(inter.className = " bg-slate-200")}>
        <DynamicInnerLayout>{children}</DynamicInnerLayout>
      </body>
    </html>
  );
}
