"use client";
import UserMetaCard from "@/components/user-profile/UserMetaCard";
import UserInfoCard from "@/components/user-profile/UserInfoCard";
import UserAddressCard from "@/components/user-profile/UserAddressCard";
import { useSelector } from "react-redux";
import type { RootState } from "@/lib/store";

export default function Profile() {
  const user = useSelector((state: RootState) => state.auth.user);

  if (!user) return null;

  return (
    <div className="space-y-6">
      <UserMetaCard />
      <UserInfoCard />
      <UserAddressCard />
    </div>
  );
}
