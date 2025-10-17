"use client";

import { StackProvider, StackClientApp } from "@stackframe/stack";
import { ThemeProvider } from "@/contexts/ThemeContext";

const stackApp = new StackClientApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  urls: {
    signIn: "/fa/login",
    afterSignIn: "/fa",
    afterSignOut: "/",
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider app={stackApp}>
      <ThemeProvider>{children}</ThemeProvider>
    </StackProvider>
  );
}
