"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { API_BASE } from "@/lib/api";

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get("redirect") || "/dashboard";
  const allowedRedirects = ["/dashboard", "/admin", "/admin/claims", "/admin/rsk-queue", "/farms", "/claims"];
  const redirectPath = allowedRedirects.includes(rawRedirect) ? rawRedirect : "/dashboard";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        credentials: "include",
        body: formData.toString()
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Invalid credentials");
      }

      const meRes = await fetch(`${API_BASE}/users/me`, { credentials: "include" });
      if (meRes.ok) {
        const user = await meRes.json();
        if (user.role === "rsk_expert") {
          router.push("/admin/rsk-queue");
          return;
        }
        if (user.role === "insurance_admin") {
          router.push("/admin/claims");
          return;
        }
      }
      router.push(redirectPath);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4 gap-4">
      <div className="w-full max-w-md">
        <Link href="/" className="text-sm text-[#006c49] font-semibold hover:underline flex items-center gap-1">
          ← Back to Precision Landing Page
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Login to AgriShield</CardTitle>
          <CardDescription>Enter your credentials to access your farms & parametric claims.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <Button type="submit" className="w-full">Log In</Button>
          </form>
          <p className="mt-4 text-center text-sm">
            Don't have an account? <Link href="/register" className="text-blue-500 hover:underline">Register</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center bg-gray-50">Loading login...</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
