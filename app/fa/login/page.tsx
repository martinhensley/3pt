"use client";

import { useStackApp, useUser } from "@stackframe/stack";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LoginPage() {
  const stackApp = useStackApp();
  const user = useUser();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.push("/fa");
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-footy-dark-green flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-footy-dark-green">
            footy limited
          </h1>
          <p className="text-gray-800 mt-2 font-medium">Admin Login</p>
        </div>

        <stackApp.SignIn />
      </div>
    </div>
  );
}
