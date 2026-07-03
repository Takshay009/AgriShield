"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface Farm {
  id: number;
  name: string;
  area_hectares: string;
  created_at: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{name: string, email: string} | null>(null);
  const [farms, setFarms] = useState<Farm[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:8000/users/me", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error("Unauthorized");
      return res.json();
    })
    .then(data => setUser(data))
    .catch(() => {
      localStorage.removeItem("token");
      router.push("/login");
    });

    fetch("http://localhost:8000/farms", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setFarms(data))
    .catch(err => console.error("Failed to fetch farms", err));
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (!user) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen apple-bg p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-center">
          <h1 className="apple-title">CropGuard Dashboard</h1>
          <Button variant="outline" className="rounded-full" onClick={handleLogout}>Log out</Button>
        </div>
        
        <Card className="apple-card">
          <CardHeader>
            <CardTitle>Welcome, {user.name}</CardTitle>
            <CardDescription>Manage your registered farms and view insights.</CardDescription>
          </CardHeader>
          <CardContent>
            {farms.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">You have no registered farms yet.</p>
                <Link href="/farms/new" className={buttonVariants()}>Add Farm</Link>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Your Farms</h3>
                  <Link href="/farms/new" className={buttonVariants({ variant: "secondary", size: "sm", className: "rounded-full" })}>Add Farm</Link>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  {farms.map(farm => (
                    <Card key={farm.id} className="apple-card card-hover cursor-pointer border border-gray-100">
                      <Link href={`/farms/${farm.id}`} className="block h-full">
                        <CardHeader className="p-6 pb-2">
                          <CardTitle className="text-xl font-semibold text-gray-900">{farm.name}</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 pt-0 text-sm text-gray-500">
                          {farm.area_hectares} hectares
                        </CardContent>
                      </Link>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
