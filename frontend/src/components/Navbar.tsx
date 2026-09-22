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
    <nav className="nav">
      <Link href="/game" className="nav__brand">
        Guess the Word
      </Link>

      <div className="nav__actions">
        {user && (
          <>
            <span className="nav__user">
              {user.username}
              <span className="nav__role">{user.role}</span>
            </span>
            {user.role === "ADMIN" && (
              <Link href="/admin" className="btn btn--secondary btn--sm">
                Reports
              </Link>
            )}
            <button onClick={handleLogout} className="btn btn--danger btn--sm">
              Log out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
