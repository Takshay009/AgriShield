"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { getApiBase, authFetch } from "@/lib/api";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Layers, 
  ChevronRight, 
  Calendar, 
  CheckCircle, 
  Clock, 
  XCircle,
  FileCheck
} from "lucide-react";

interface Claim {
  id: number;
  farm_id: number;
  status: string;
  is_eligible: boolean;
  created_at: string;
}

export default function ClaimsPage() {
  const router = useRouter();
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const apiBase = await getApiBase();
      authFetch(`${apiBase}/claims`)
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then((data) => {
          setClaims(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setLoading(false);
        });
    })();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f4] via-[#e6f4ea] to-[#dcfce7] p-4 md:p-8 font-sans text-[#1a1c1e] relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#54de99]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="rounded-2xl bg-white/90 backdrop-blur-md border border-[#c0c9c0]/60 text-[#0f4d32] hover:bg-[#f0f9f4] hover:border-[#0f4d32] font-bold shadow-sm flex items-center gap-2 transition-all"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </div>

        {/* Header Hero */}
        <div className="bg-white/85 backdrop-blur-md border border-white/60 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f4d32] to-[#00351f] text-white flex items-center justify-center shadow-lg shrink-0 transform -rotate-2 hover:rotate-0 transition-transform">
              <ShieldCheck className="w-8 h-8 text-[#54de99]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00351f] to-[#0f4d32]">
                My Insurance Claims
              </h1>
              <p className="text-[#556057] font-medium mt-1 flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-[#0f4d32]" />
                Parametric claim history, ZK verification & payout records
              </p>
            </div>
          </div>
        </div>

        {/* Claims List Card */}
        <Card className="bg-white/85 backdrop-blur-md border border-white/60 shadow-xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#f0f9f4] to-white border-b border-[#e5e7eb] p-6">
            <CardTitle className="text-lg font-extrabold text-[#1a1c1e] flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-[#0f4d32]" />
              Submitted Claims ({claims.length})
            </CardTitle>
            <CardDescription className="text-xs text-[#64748b]">
              Click on any claim to view cryptographic proof and blockchain status
            </CardDescription>
          </CardHeader>

          <CardContent className="p-6">
            {loading ? (
              <div className="py-12 flex justify-center items-center gap-3">
                <div className="w-5 h-5 border-2 border-[#0f4d32] border-t-transparent rounded-full animate-spin"></div>
                <span className="font-bold text-[#0f4d32] text-sm">Loading claims...</span>
              </div>
            ) : claims.length === 0 ? (
              <div className="text-center py-16 px-4">
                <ShieldCheck className="w-12 h-12 text-[#94a3b8] mx-auto mb-3 opacity-50" />
                <p className="text-[#475569] font-bold text-base">No claims submitted yet</p>
                <p className="text-xs text-[#64748b] mt-1 max-w-sm mx-auto">
                  When a farm's climate risk score exceeds 60%, an automated claim can be submitted directly from the farm dashboard.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {claims.map((claim) => {
                  const isApproved = claim.status === "approved";
                  const isRejected = claim.status === "rejected";

                  return (
                    <Link
                      key={claim.id}
                      href={`/claims/${claim.id}`}
                      className="block p-5 rounded-2xl bg-[#f8fafc] hover:bg-white border border-[#e2e8f0] hover:border-[#54de99] hover:shadow-lg transition-all transform hover:-translate-y-0.5 group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0f4d32]/10 to-[#54de99]/20 flex items-center justify-center text-[#0f4d32] font-black group-hover:scale-105 transition-transform">
                            #{claim.id}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-extrabold text-base text-[#1a1c1e] group-hover:text-[#0f4d32] transition-colors">
                                Parametric Claim #{claim.id}
                              </h3>
                              <span className="text-xs font-bold text-[#64748b] bg-white px-2 py-0.5 rounded-lg border border-[#e2e8f0]">
                                Farm #{claim.farm_id}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-[#64748b]">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(claim.created_at).toLocaleDateString()}
                              </span>
                              <span className={claim.is_eligible ? "text-emerald-700 font-bold" : "text-red-700 font-bold"}>
                                {claim.is_eligible ? "Eligible (Risk &ge; 60%)" : "Ineligible"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span
                            className={`px-3.5 py-1.5 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 border ${
                              isApproved
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : isRejected
                                ? "bg-red-100 text-red-800 border-red-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            {isApproved ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            ) : isRejected ? (
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                            )}
                            {claim.status}
                          </span>
                          <ChevronRight className="w-5 h-5 text-[#94a3b8] group-hover:text-[#0f4d32] group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
