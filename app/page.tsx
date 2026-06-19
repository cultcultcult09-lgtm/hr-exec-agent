"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
import Login from "@/components/Login";
import Console from "@/components/Console";

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  if (!user) return <Login onLogin={setUser} />;
  return <Console user={user} onLogout={() => setUser(null)} />;
}
