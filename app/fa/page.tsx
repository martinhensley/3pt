"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FaRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-600">Redirecting to admin dashboard...</p>
    </div>
  );
}
