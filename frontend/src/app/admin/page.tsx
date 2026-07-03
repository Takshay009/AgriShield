"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";

interface Claim {
  id: number;
  farm_id: number;
  user_id: number;
  status: string;
  is_eligible: boolean;
  created_at: string;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    fetch("http://localhost:8000/admin/claims", {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => setClaims(data))
    .catch(err => console.error(err));
  }, [router]);

  return (
    <div className="min-h-screen apple-bg p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Button variant="outline" className="rounded-full" onClick={() => router.push("/dashboard")}>&larr; User Dashboard</Button>
        <div className="flex justify-between items-center py-4">
          <h1 className="apple-title">Admin Claims Dashboard</h1>
        </div>
        
        <Card className="apple-card">
          <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
            <CardTitle>All Submitted Claims</CardTitle>
            <CardDescription>Review and verify claims from all users.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {claims.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No claims exist in the system.</p>
            ) : (
              <div className="grid gap-6">
                {claims.map(claim => (
                  <Card key={claim.id} className="apple-card card-hover border border-gray-100 cursor-pointer" onClick={() => router.push(`/admin/claims/${claim.id}`)}>
                    <CardHeader className="p-6 pb-2">
                      <CardTitle className="text-lg flex justify-between items-center">
                        <span>Claim #{claim.id}</span>
                        <span className={`text-sm px-3 py-1 rounded-full ${
                          claim.status === 'approved' ? 'bg-green-100 text-green-800' :
                          claim.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {claim.status.toUpperCase()}
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 text-sm text-gray-500 flex justify-between">
                      <span>Farm ID: {claim.farm_id} | User ID: {claim.user_id}</span>
                      <span>Submitted: {new Date(claim.created_at).toLocaleDateString()}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
