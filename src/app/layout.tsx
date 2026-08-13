import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PromptMe — Build Better AI Prompts",
    template: "%s | PromptMe",
  },
  description:
    "A workspace to build, test, compare, and organize high-quality AI prompts. Turn trial-and-error prompting into a repeatable, versioned system.",
  keywords: ["AI prompts", "prompt engineering", "ChatGPT", "Claude", "Gemini", "prompt builder"],
  authors: [{ name: "PromptMe" }],
  openGraph: {
    title: "PromptMe — Build Better AI Prompts",
    description: "A workspace to build, test, compare, and organize high-quality AI prompts.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
