"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { FullScreenLoading } from "@/components/system/FullScreenLoading";

export default function MyProfileRedirectPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(`/profile/${user.id}`);
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [user, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <FullScreenLoading />
    </div>
  );
}
