"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getApiBase, authFetch } from "@/lib/api";
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  KeyRound,
  FileCheck,
  AlertTriangle,
  ExternalLink,
  RefreshCw
} from "lucide-react";

export default function AdminClaimReviewPage() {
  const params = useParams();
  const router = useRouter();
  const [claim, setClaim] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<boolean | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const apiBase = await getApiBase();
      authFetch(`${apiBase}/users/me`)
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then((userData) => {
          if (userData.role !== "insurance_admin") {
            router.push("/dashboard");
            return;
          }
          return authFetch(`${apiBase}/admin/claims/${params.id}`)
            .then((res) => {
              if (!res.ok) throw new Error("Error");
              return res.json();
            })
            .then((data) => setClaim(data));
        })
        .catch(() => router.push("/dashboard"));
    })();
  }, [params.id, router]);

  const handleVerify = async () => {
    setVerifying(true);
    const apiBase = await getApiBase();
    try {
      const res = await authFetch(`${apiBase}/admin/claims/${params.id}/verify`, {
        method: "POST",
      });
      const data = await res.json();
      setVerificationResult(data.is_valid);
    } catch (err) {
      console.error(err);
      setVerificationResult(false);
    }
    setVerifying(false);
  };

  const handleDecision = async (decision: "approve" | "reject") => {
    setActionLoading(true);
    const apiBase = await getApiBase();
    try {
      const res = await authFetch(`${apiBase}/admin/claims/${params.id}/${decision}`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedClaim = await res.json();
        setClaim(updatedClaim);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!claim) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f8faf8] via-[#f2f7f3] to-[#eaf3eb] flex items-center justify-center p-8">
        <div className="text-center space-y-3">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-600 mx-auto" />
          <p className="text-sm font-medium text-gray-600">Loading claim metadata & cryptographic proofs...</p>
        </div>
      </div>
    );
  }

  const isApproved = claim.status === "approved";
  const isRejected = claim.status === "rejected";
  const isPending = claim.status === "pending";

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f8faf8] via-[#f2f7f3] to-[#eaf3eb] text-gray-900 pb-16">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-emerald-900/10 shadow-xs px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin")}
            className="text-gray-600 hover:text-gray-900 gap-1.5 rounded-xl"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Claims Portal
          </Button>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                isApproved
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : isRejected
                  ? "bg-red-100 text-red-800 border border-red-200"
                  : "bg-amber-100 text-amber-800 border border-amber-200"
              }`}
            >
              {isApproved && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              {isRejected && <XCircle className="w-3.5 h-3.5 text-red-600" />}
              {isPending && <Clock className="w-3.5 h-3.5 text-amber-600" />}
              {claim.status}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-8 space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-400">
        {/* Title Card */}
        <div className="bg-white/95 backdrop-blur rounded-3xl p-6 md:p-8 border border-emerald-900/10 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
                Claim Assessment Report
              </span>
              <span>•</span>
              <span className="text-xs text-gray-500">
                Submitted {new Date(claim.created_at).toLocaleString()}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              Claim #{claim.id} Evaluation
            </h1>
            <p className="text-xs md:text-sm text-gray-500">
              Farm <strong className="text-gray-800">#{claim.farm_id}</strong> &nbsp;|&nbsp; Insured User <strong className="text-gray-800">#{claim.user_id}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2.5 rounded-2xl bg-emerald-50/80 border border-emerald-200/80 text-center">
              <p className="text-[10px] uppercase font-bold text-emerald-800">Parametric Trigger</p>
              <p className={`text-sm font-extrabold ${claim.is_eligible ? "text-emerald-700" : "text-amber-700"}`}>
                {claim.is_eligible ? "Eligible (>60% Risk)" : "Ineligible (<60%)"}
              </p>
            </div>
          </div>
        </div>

        {/* Details and ZKP Verification Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Card 1: Claim & Blockchain Meta */}
          <Card className="bg-white/95 backdrop-blur rounded-3xl border border-emerald-900/10 shadow-sm">
            <CardHeader className="p-6 pb-4 border-b border-gray-100">
              <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-600" />
                Policy & Telemetry Overview
              </CardTitle>
              <CardDescription className="text-xs text-gray-500">
                Automated policy parameters stored in immutable registry.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
                  <p className="text-[11px] font-medium text-gray-500">Farm Identifier</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">#{claim.farm_id}</p>
                </div>
                <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
                  <p className="text-[11px] font-medium text-gray-500">Beneficiary User</p>
                  <p className="text-base font-bold text-gray-900 mt-0.5">#{claim.user_id}</p>
                </div>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
                <p className="text-[11px] font-medium text-gray-500">Submission Timestamp</p>
                <p className="text-xs font-semibold text-gray-800 mt-0.5">
                  {new Date(claim.created_at).toUTCString()}
                </p>
              </div>

              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
                <p className="text-[11px] font-medium text-gray-500">On-Chain Transaction Log</p>
                {claim.tx_hash ? (
                  <p className="font-mono text-[11px] text-emerald-800 break-all bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/50 mt-1">
                    {claim.tx_hash}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic mt-0.5">No blockchain transaction logged yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Card 2: ZKP Verification & Decision Actions */}
          <Card className="bg-white/95 backdrop-blur rounded-3xl border border-emerald-900/10 shadow-sm flex flex-col justify-between">
            <div>
              <CardHeader className="p-6 pb-4 border-b border-gray-100">
                <CardTitle className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-teal-600" />
                  Zero-Knowledge Proof Verification
                </CardTitle>
                <CardDescription className="text-xs text-gray-500">
                  Verify cryptographic validity without exposing private farm telemetry.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-6 space-y-4">
                {!claim.proof_data ? (
                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold">No ZK Proof Generated</p>
                      <p className="text-xs text-amber-700/90 mt-0.5">
                        Farmer has not generated a Zero-Knowledge Proof for this claim yet.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Button
                      onClick={handleVerify}
                      disabled={verifying}
                      className="w-full rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs py-3 h-auto shadow-md shadow-emerald-900/10"
                    >
                      {verifying ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Verifying cryptographic zkSNARK proof...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <KeyRound className="w-4 h-4" />
                          Verify ZK Cryptographic Proof
                        </span>
                      )}
                    </Button>

                    {verificationResult !== null && (
                      <div
                        className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${
                          verificationResult
                            ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                            : "bg-red-50 border-red-200 text-red-900"
                        }`}
                      >
                        {verificationResult ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>✓ Cryptographic proof valid. Risk parameters meet parametric trigger.</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                            <span>✗ Proof verification failed. Cryptographic signature invalid.</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </div>

            {/* Action Bar for Decision */}
            {claim.status === "pending" && (
              <div className="p-6 bg-gray-50/80 border-t border-gray-100 rounded-b-3xl space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Underwriter Action
                </p>
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleDecision("approve")}
                    disabled={actionLoading}
                    className="flex-1 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2.5 h-auto shadow-sm"
                  >
                    Approve Claim & Payout
                  </Button>
                  <Button
                    onClick={() => handleDecision("reject")}
                    disabled={actionLoading}
                    variant="outline"
                    className="flex-1 rounded-2xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-bold py-2.5 h-auto"
                  >
                    Reject Claim
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}

