"use client";

import { StackProvider, StackTheme } from "@stackframe/stack";
import { ThemeProvider } from "@/contexts/ThemeContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <StackProvider
      projectId={process.env.NEXT_PUBLIC_STACK_PROJECT_ID!}
      publishableClientKey={process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!}
      theme={StackTheme.getDefaultTheme()}
      urls={{
        signIn: "/fa/login",
        afterSignIn: "/fa",
        afterSignOut: "/",
      }}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </StackProvider>
  );
}
