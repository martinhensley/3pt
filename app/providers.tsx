"use client";

import { StackProvider, StackTheme, StackClientApp } from "@stackframe/stack";
import { ThemeProvider } from "@/contexts/ThemeContext";

const stackApp = new StackClientApp({
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
    <StackProvider
      app={stackApp}
      theme={StackTheme.getDefaultTheme()}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </StackProvider>
  );
}
