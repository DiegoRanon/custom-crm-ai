"use client";

import { signOut } from "next-auth/react";

export function LogoutButton() {
  const handleLogout = async () => {
    console.log("Logout clicked");

    await signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
    >
      Logout
    </button>
  );
}
