"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { showToast } from "@/components/toast";
import { useAuth } from "@/components/auth-context";
import { request } from "@/lib/api";
import { AuthResponse } from "@/lib/types";

export default function LoginPage(): JSX.Element {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await request<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      setSession(data.accessToken, data.user);
      showToast("Login successful");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="card auth-card">
        <h1>Sign in</h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Use your account to continue.</p>

        <form onSubmit={onSubmit}>
          <label className="field">
            Email
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="field">
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

          <button disabled={loading} className="button primary" type="submit" style={{ width: "100%" }}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p>
          Don&apos;t have an account? <Link href="/register">Register</Link>
        </p>
      </section>
    </main>
  );
}
