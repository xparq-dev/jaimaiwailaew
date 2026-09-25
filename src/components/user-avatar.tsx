"use client";

import { UserRound } from "lucide-react";
import Image from "next/image";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

export function UserAvatar({
  avatarUrl,
  className,
  fallback,
}: {
  readonly avatarUrl: string | null;
  readonly className?: string;
  readonly fallback?: ReactNode;
}) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const showAvatar = avatarUrl !== null && avatarUrl !== failedAvatarUrl;

  if (showAvatar) {
    return (
      <Image
        alt=""
        className={cn("rounded-full object-cover", className)}
        height={40}
        onError={() => setFailedAvatarUrl(avatarUrl)}
        referrerPolicy="no-referrer"
        src={avatarUrl}
        unoptimized
        width={40}
      />
    );
  }

  return fallback ?? <UserRound aria-hidden="true" className="size-4" />;
}
