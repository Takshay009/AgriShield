"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { getApiBase, authFetch } from "@/lib/api";
import { 
  ShieldCheck, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Filter, 
  ArrowRight, 
  ExternalLink,
  RefreshCw,
  LogOut,
  SlidersHorizontal,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Zap,
  Activity
} from "lucide-react";

interface Claim {
  id: number;
  farm_id: number;
  user_id: number;
  status: string;
  is_eligible: boolean;
  created_at: string;
  tx_hash?: string | null;
  proof_data?: string | null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchAdminData = async () => {
    setLoading(true);
    const apiBase = await getApiBase();
    try {
      const meRes = await authFetch(`${apiBase}/users/me`);
      if (!meRes.ok) {
        router.push("/dashboard");
        return;
      }
      const userData = await meRes.json();
      if (userData.role !== "insurance_admin") {
        router.push("/dashboard");
        return;
      }
      setUser(userData);

      const claimsRes = await authFetch(`${apiBase}/admin/claims`);
      if (claimsRes.ok) {
        const data = await claimsRes.json();
        setClaims(data);
      }
    } catch (err) {
      console.error(err);
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [router]);

  const handleLogout = async () => {
    const apiBase = await getApiBase();
    await authFetch(`${apiBase}/auth/logout`, { method: "POST" });
    router.push("/login");
  };

  // Metrics computation from active claims
  const totalClaims = claims.length;
  const pendingClaims = claims.filter((c) => c.status === "pending").length;
  const approvedClaims = claims.filter((c) => c.status === "approved").length;
  const rejectedClaims = claims.filter((c) => c.status === "rejected").length;
  const eligibleClaims = claims.filter((c) => c.is_eligible).length;
  const eligiblePercent = totalClaims > 0 ? Math.round((eligibleClaims / totalClaims) * 100) : 0;

  // Filtered claims
  const filteredClaims = claims.filter((claim) => {
    const matchesStatus = filterStatus === "all" ? true : claim.status === filterStatus;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      q === "" ||
      claim.id.toString().includes(q) ||
      claim.farm_id.toString().includes(q) ||
      claim.user_id.toString().includes(q) ||
      (claim.tx_hash && claim.tx_hash.toLowerCase().includes(q));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8faf8] via-[#f2f7f3] to-[#eaf3eb] text-gray-900 pb-16">
      {/* Top Header / Nav */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-emerald-900/10 shadow-xs px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-gray-900 text-base">AgriShield Underwriting Portal</span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200/60">
                  Insurance Admin
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Connected as <span className="font-medium text-gray-700">{user?.name || user?.email || "Admin"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdminData}
              disabled={loading}
              className="rounded-xl border-emerald-200 bg-white/80 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              Sync Data
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl border-red-200 bg-white/80 hover:bg-red-50 text-red-600 text-xs font-semibold gap-1.5 h-9"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 pt-8 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-400">
        {/* Banner Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 p-7 md:p-8 text-white shadow-xl shadow-emerald-950/10">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <ShieldCheck className="w-72 h-72 text-white" />
          </div>
          <div className="relative z-10 max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-medium backdrop-blur-sm">
              <Activity className="w-3.5 h-3.5 text-emerald-300" />
              Parametric Zero-Knowledge Settlement Engine
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Insurance Claims & Risk Settlement
            </h1>
            <p className="text-sm text-emerald-100/80 leading-relaxed">
              Verify cryptographic zero-knowledge claims proofs, review automated IoT risk assessments, and finalize parametric insurance disbursements.
            </p>
          </div>
        </div>

        {/* High-Level Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Card 1: Total Claims */}
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 border border-emerald-900/10 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500">Total Filings</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-gray-900">{totalClaims}</p>
              <p className="text-xs text-gray-500 mt-0.5">Parametric policies</p>
            </div>
          </div>

          {/* Card 2: Pending Reviews */}
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 border border-emerald-900/10 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">Pending Review</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-amber-700">{pendingClaims}</p>
              <p className="text-xs text-gray-500 mt-0.5">Awaiting ZKP verification</p>
            </div>
          </div>

          {/* Card 3: Approved */}
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 border border-emerald-900/10 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-700">Settled & Approved</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-emerald-700">{approvedClaims}</p>
              <p className="text-xs text-gray-500 mt-0.5">Disbursement cleared</p>
            </div>
          </div>

          {/* Card 4: Automated Eligibility */}
          <div className="bg-white/90 backdrop-blur rounded-2xl p-5 border border-emerald-900/10 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-teal-700">Eligibility Rate</span>
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-teal-800">{eligiblePercent}%</p>
              <p className="text-xs text-gray-500 mt-0.5">{eligibleClaims} eligible for trigger</p>
            </div>
          </div>
        </div>

        {/* Claims Directory and Filter Section */}
        <div className="bg-white/95 backdrop-blur rounded-3xl border border-emerald-900/10 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Submitted Claims Queue</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Examine policy filings, verify zero-knowledge cryptographic proofs, and disburse payouts.
              </p>
            </div>

            {/* Status Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-gray-100/80 rounded-2xl border border-gray-200/60">
              <button
                onClick={() => setFilterStatus("all")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === "all"
                    ? "bg-white text-emerald-950 shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                All ({totalClaims})
              </button>
              <button
                onClick={() => setFilterStatus("pending")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === "pending"
                    ? "bg-amber-500 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Pending ({pendingClaims})
              </button>
              <button
                onClick={() => setFilterStatus("approved")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === "approved"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Approved ({approvedClaims})
              </button>
              <button
                onClick={() => setFilterStatus("rejected")}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  filterStatus === "rejected"
                    ? "bg-red-600 text-white shadow-xs"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Rejected ({rejectedClaims})
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 bg-gray-50/50 border-b border-gray-100 flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search by Claim ID, Farm ID, User ID, or Tx Hash..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-gray-800 placeholder-gray-400"
              />
            </div>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="text-xs text-gray-500 hover:text-gray-800 h-8 px-2"
              >
                Clear
              </Button>
            )}
          </div>

          {/* Claims List Table / Cards */}
          <div className="p-6">
            {loading ? (
              <div className="py-16 text-center text-sm text-gray-400 flex flex-col items-center justify-center gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                <span>Loading claims from registry...</span>
              </div>
            ) : filteredClaims.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 mx-auto flex items-center justify-center">
                  <FileText className="w-6 h-6" />
                </div>
                <p className="text-sm font-semibold text-gray-700">No claims match your criteria</p>
                <p className="text-xs text-gray-400">
                  Try adjusting the filter tab or clearing your search term.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredClaims.map((claim) => {
                  const isApproved = claim.status === "approved";
                  const isRejected = claim.status === "rejected";
                  const isPending = claim.status === "pending";

                  return (
                    <div
                      key={claim.id}
                      onClick={() => router.push(`/admin/claims/${claim.id}`)}
                      className="group bg-white border border-gray-100 hover:border-emerald-500/30 rounded-2xl p-4 md:p-5 transition-all shadow-xs hover:shadow-md cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="flex items-start md:items-center gap-4">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                            isApproved
                              ? "bg-emerald-50 text-emerald-600"
                              : isRejected
                              ? "bg-red-50 text-red-600"
                              : "bg-amber-50 text-amber-600"
                          }`}
                        >
                          {isApproved ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : isRejected ? (
                            <XCircle className="w-5 h-5" />
                          ) : (
                            <Clock className="w-5 h-5" />
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">
                              Claim #{claim.id}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                isApproved
                                  ? "bg-emerald-100 text-emerald-800"
                                  : isRejected
                                  ? "bg-red-100 text-red-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {claim.status}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                                claim.is_eligible
                                  ? "bg-teal-50 text-teal-700 border border-teal-200/60"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {claim.is_eligible ? "✓ Trigger Met" : "Below Trigger"}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                            <span>
                              Farm ID: <strong className="text-gray-700 font-medium">#{claim.farm_id}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              User ID: <strong className="text-gray-700 font-medium">#{claim.user_id}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Filed: {new Date(claim.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                        <Button
                          size="sm"
                          className="rounded-xl bg-emerald-50 text-emerald-800 hover:bg-emerald-600 hover:text-white border border-emerald-200 group-hover:border-transparent text-xs font-semibold px-4 h-8 transition-colors gap-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/admin/claims/${claim.id}`);
                          }}
                        >
                          Evaluate Claim
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

