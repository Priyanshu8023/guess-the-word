"use client";

import { useRouter } from "next/navigation";
import { removeToken, getMe } from "@/lib/api";
import { useEffect, useState } from "react";
import Link from "next/link";

interface User {
  id: number;
  username: string;
  role: string;
}

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <nav className="navbar">
      <Link href="/game" className="navbar-brand">
        <span className="logo-icon">🔤</span>
        <h1>Guess The Word</h1>
      </Link>

      <div className="navbar-actions">
        {user && (
          <>
            <span className="navbar-user">
              {user.username}
              <span className="navbar-role">{user.role}</span>
            </span>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="btn btn-secondary btn-sm">
                📊 Reports
              </Link>
            )}
            <button onClick={handleLogout} className="btn btn-danger btn-sm">
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
