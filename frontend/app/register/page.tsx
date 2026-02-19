"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { showToast } from "@/components/toast";
import { useAuth } from "@/components/auth-context";
import { request } from "@/lib/api";
import { AuthResponse } from "@/lib/types";

export default function RegisterPage(): JSX.Element {
  const router = useRouter();
  const { setSession } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await request<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
      setSession(data.accessToken, data.user);
      showToast("Registration successful");
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="card auth-card">
        <h1>Create account</h1>
        <p style={{ color: "var(--muted)", marginTop: 0 }}>Start managing your personal tasks.</p>

        <form onSubmit={onSubmit}>
          <label className="field">
            Name
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>
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
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p>
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
