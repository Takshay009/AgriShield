"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getApiBase, getErrorMessage, authFetch } from "@/lib/api";
import { 
  ShieldCheck, 
  ArrowLeft, 
  Cpu, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Sparkles,
  Calendar,
  Layers,
  CheckCircle,
  XCircle
} from "lucide-react";

export default function ClaimDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [claim, setClaim] = useState<any>(null);
  const [generating, setGenerating] = useState(false);
  const [logging, setLogging] = useState(false);

  useEffect(() => {
    (async () => {
      const apiBase = await getApiBase();
      authFetch(`${apiBase}/claims/${params.id}`)
        .then((res) => {
          if (!res.ok) throw new Error("Not found");
          return res.json();
        })
        .then((data) => setClaim(data))
        .catch(() => router.push("/login"));
    })();
  }, [params.id, router]);

  const handleGenerateProof = async () => {
    setGenerating(true);
    const apiBase = await getApiBase();
    try {
      const res = await authFetch(`${apiBase}/claims/${params.id}/generate-proof`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedClaim = await res.json();
        setClaim(updatedClaim);
      } else {
        const error = await res.json();
        alert(getErrorMessage(error, "Failed to generate proof"));
      }
    } catch (err) {
      console.error(err);
    }
    setGenerating(false);
  };

  const handleLogBlockchain = async () => {
    setLogging(true);
    const apiBase = await getApiBase();
    try {
      const res = await authFetch(`${apiBase}/claims/${params.id}/log-blockchain`, {
        method: "POST",
      });
      if (res.ok) {
        const updatedClaim = await res.json();
        setClaim(updatedClaim);
      } else {
        const error = await res.json();
        alert(getErrorMessage(error, "Failed to log to blockchain"));
      }
    } catch (err) {
      console.error(err);
    }
    setLogging(false);
  };

  if (!claim) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f0f9f4] via-[#e6f4ea] to-[#dcfce7] flex items-center justify-center">
        <div className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-6 py-4 rounded-2xl shadow-lg border border-emerald-100">
          <div className="w-5 h-5 border-2 border-[#0f4d32] border-t-transparent rounded-full animate-spin"></div>
          <span className="font-bold text-[#0f4d32]">Loading claim details...</span>
        </div>
      </div>
    );
  }

  const isApproved = claim.status === "approved";
  const isRejected = claim.status === "rejected";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f4] via-[#e6f4ea] to-[#dcfce7] p-4 md:p-8 font-sans text-[#1a1c1e] relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#54de99]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-5xl mx-auto space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            className="rounded-2xl bg-white/90 backdrop-blur-md border border-[#c0c9c0]/60 text-[#0f4d32] hover:bg-[#f0f9f4] hover:border-[#0f4d32] font-bold shadow-sm flex items-center gap-2 transition-all"
            onClick={() => router.push("/claims")}
          >
            <ArrowLeft className="w-4 h-4" /> All Claims
          </Button>

          <Button
            variant="outline"
            className="rounded-2xl bg-white/90 backdrop-blur-md border border-[#c0c9c0]/60 text-[#404943] hover:text-[#0f4d32] font-bold shadow-sm"
            onClick={() => router.push("/dashboard")}
          >
            Dashboard
          </Button>
        </div>

        {/* Hero Header Card */}
        <div className="bg-white/85 backdrop-blur-md border border-white/60 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f4d32] to-[#00351f] text-white flex items-center justify-center shadow-lg shrink-0 transform -rotate-2 hover:rotate-0 transition-transform">
              <ShieldCheck className="w-8 h-8 text-[#54de99]" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00351f] to-[#0f4d32]">
                  Claim #{claim.id}
                </h1>
              </div>
              <p className="text-[#556057] font-medium mt-1 flex items-center gap-2 text-sm">
                <Layers className="w-4 h-4 text-[#0f4d32]" />
                Parametric Index Insurance Claim &bull; Farm #{claim.farm_id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider shadow-sm flex items-center gap-2 border ${
                isApproved
                  ? "bg-emerald-100/90 text-emerald-800 border-emerald-300"
                  : isRejected
                  ? "bg-red-100/90 text-red-800 border-red-300"
                  : "bg-amber-100/90 text-amber-800 border-amber-300"
              }`}
            >
              {isApproved ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : isRejected ? (
                <XCircle className="w-4 h-4 text-red-600" />
              ) : (
                <Clock className="w-4 h-4 text-amber-600 animate-pulse" />
              )}
              {claim.status}
            </span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          
          {/* Claim Details Card */}
          <Card className="bg-white/85 backdrop-blur-md border border-white/60 shadow-xl rounded-3xl overflow-hidden flex flex-col">
            <CardHeader className="bg-gradient-to-r from-[#f0f9f4] to-white border-b border-[#e5e7eb] p-6">
              <CardTitle className="text-lg font-extrabold text-[#1a1c1e] flex items-center gap-2.5">
                <FileText className="w-5 h-5 text-[#0f4d32]" />
                Claim Telemetry & Details
              </CardTitle>
              <CardDescription className="text-xs text-[#64748b]">
                Verified satellite indices & policy metadata
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-4 flex-1">
              <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0] flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Associated Farm</p>
                  <p className="font-extrabold text-base text-[#0f4d32] mt-0.5">Farm #{claim.farm_id}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-xl text-xs font-bold text-[#0f4d32] border-[#c0c9c0] hover:bg-[#f0f9f4]"
                  onClick={() => router.push(`/farms/${claim.farm_id}`)}
                >
                  View Farm &rarr;
                </Button>
              </div>

              <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0] flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider">Date Submitted</p>
                  <p className="font-extrabold text-sm text-[#1a1c1e] mt-0.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#64748b]" />
                    {new Date(claim.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className={`rounded-2xl p-4 border shadow-sm flex items-center justify-between ${
                claim.is_eligible 
                  ? "bg-emerald-50/80 border-emerald-200" 
                  : "bg-red-50/80 border-red-200"
              }`}>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#64748b]">Trigger Eligibility</p>
                  <p className={`font-extrabold text-sm mt-0.5 flex items-center gap-1.5 ${
                    claim.is_eligible ? "text-emerald-800" : "text-red-800"
                  }`}>
                    {claim.is_eligible ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Eligible for Automated Payout (Risk &ge; 60%)
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        Ineligible (Risk Below 60% Threshold)
                      </>
                    )}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#0f4d32]/5 to-[#54de99]/10 border border-[#0f4d32]/10 text-xs text-[#404943] leading-relaxed">
                <strong>Parametric Rule:</strong> If farm climate risk score exceeds 60% with verified vegetative stress, claims qualify for instant zero-knowledge cryptographic payout.
              </div>
            </CardContent>
          </Card>

          {/* Cryptographic Processing & RSK Blockchain Card */}
          <Card className="bg-white/85 backdrop-blur-md border border-white/60 shadow-xl rounded-3xl overflow-hidden flex flex-col">
            <CardHeader className="bg-gradient-to-r from-[#f0f9f4] to-white border-b border-[#e5e7eb] p-6">
              <CardTitle className="text-lg font-extrabold text-[#1a1c1e] flex items-center gap-2.5">
                <Cpu className="w-5 h-5 text-[#0f4d32]" />
                Zero-Knowledge & Settlement
              </CardTitle>
              <CardDescription className="text-xs text-[#64748b]">
                Privacy-preserving zkSNARK proof & on-chain logging
              </CardDescription>
            </CardHeader>

            <CardContent className="p-6 space-y-5 flex-1">
              {/* ZK Proof Step */}
              <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0] shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <p className="text-xs font-bold text-[#1a1c1e] uppercase tracking-wider">
                      Zero Knowledge Proof
                    </p>
                  </div>
                  {!claim.proof_data && claim.is_eligible && (
                    <Button
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-[#0f4d32] to-[#125c3c] hover:from-[#00351f] hover:to-[#0f4d32] text-white font-bold text-xs shadow-md border-0"
                      onClick={handleGenerateProof}
                      disabled={generating}
                    >
                      {generating ? "Generating Proof..." : "Generate Proof"}
                    </Button>
                  )}
                </div>

                {claim.proof_data ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ZK Proof Cryptographically Generated
                    </div>
                    <pre className="p-3 bg-[#0a1a12] text-[#54de99] rounded-xl text-[11px] font-mono overflow-x-auto max-h-36 border border-emerald-950/40 shadow-inner">
                      {JSON.stringify(JSON.parse(claim.proof_data), null, 2)}
                    </pre>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-[#94a3b8] italic">
                    {claim.is_eligible 
                      ? "Click 'Generate Proof' to compute zkSNARK witness." 
                      : "Proof requires eligible trigger threshold."}
                  </p>
                )}
              </div>

              {/* Blockchain Tx Hash Step */}
              <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0] shadow-sm space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-bold text-[#1a1c1e] uppercase tracking-wider">
                      RSK Blockchain Log
                    </p>
                  </div>
                  {!claim.tx_hash && claim.proof_data && (
                    <Button
                      size="sm"
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md border-0"
                      onClick={handleLogBlockchain}
                      disabled={logging}
                    >
                      {logging ? "Logging to RSK..." : "Log to Blockchain"}
                    </Button>
                  )}
                </div>

                {claim.tx_hash ? (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs text-blue-700 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                      Transaction Anchored On-Chain
                    </div>
                    <p className="font-mono text-xs text-[#0f4d32] bg-emerald-50/90 px-3 py-2 rounded-xl border border-emerald-200 break-all select-all font-bold">
                      {claim.tx_hash}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs font-mono text-[#94a3b8] italic">
                    {claim.proof_data
                      ? "Ready to anchor on RSK Blockchain."
                      : "Generate proof before logging to blockchain."}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
