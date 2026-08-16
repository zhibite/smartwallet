"use client";
import React, { createContext, useContext } from "react";
import type { Role } from "@prisma/client";

export type AuthUser = {
  uid: string;
  username: string;
  role: Role;
};

type AuthContextType = {
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({
  user,
  children,
}: {
  user: AuthUser | null;
  children: React.ReactNode;
}) {
  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return { user: null };
  }
  return ctx;
}

export function useRequireAdmin(): boolean {
  const { user } = useAuth();
  return user?.role === "ADMIN";
}
