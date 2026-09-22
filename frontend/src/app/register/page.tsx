"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { register } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (username.length < 5) {
      setError("Username must be at least 5 characters long.");
      return;
    }

    if (!/[a-z]/.test(username)) {
      setError("Username must contain at least one lowercase letter.");
      return;
    }

    if (!/[A-Z]/.test(username)) {
      setError("Username must contain at least one uppercase letter.");
      return;
    }

    if (password.length < 5) {
      setError("Password must be at least 5 characters long.");
      return;
    }

    if (!/[a-zA-Z]/.test(password)) {
      setError("Password must contain at least one letter.");
      return;
    }

    if (!/[0-9]/.test(password)) {
      setError("Password must contain at least one number.");
      return;
    }

    if (!/[$%*&]/.test(password)) {
      setError(
        "Password must contain at least one special character ($, %, *, &)."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      await register(username, password);
      router.push("/login");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Registration failed";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth">
      <div className="auth__form">
        <div className="auth__header">
          <h1 className="auth__title">Create an account</h1>
          <p className="auth__subtitle">
            Register to start playing Guess the Word.
          </p>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label className="field__label" htmlFor="reg-username">
              Username
            </label>
            <input
              id="reg-username"
              type="text"
              className="input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoComplete="username"
            />
            <p className="field__hint">
              At least 5 characters. Must include uppercase and lowercase
              letters.
            </p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="reg-password">
              Password
            </label>
            <input
              id="reg-password"
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
            <p className="field__hint">
              At least 5 characters. Letters, numbers, and a special character
              ($, %, *, &).
            </p>
          </div>

          <div className="field">
            <label className="field__label" htmlFor="reg-confirm">
              Confirm password
            </label>
            <input
              id="reg-confirm"
              type="password"
              className="input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary btn--block"
            disabled={loading}
          >
            {loading ? "Creating account\u2026" : "Create account"}
          </button>
        </form>

        <p className="auth__footer">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
