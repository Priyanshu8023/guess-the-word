"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(username, password);
      router.push("/game");
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Login failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__form">
        <div className="auth__header">
          <h1 className="auth__title">Sign in to Guess the Word</h1>
          <p className="auth__subtitle">
            Enter your credentials to continue playing.
          </p>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="login-username">
              Username
            </label>
            <input
              id="login-username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
          </div>

          <div className="field">
            <label className="field__label" htmlFor="login-password">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={loading}
          >
            {loading ? "Signing in\u2026" : "Sign in"}
          </button>
        </form>

        <p className="auth__footer">
          No account?{" "}
          <Link href="/register">Create one</Link>
        </p>
      </div>
    </div>
  );
}
