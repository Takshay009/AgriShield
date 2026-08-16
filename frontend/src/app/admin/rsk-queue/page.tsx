"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";
import { getApiBase, authFetch } from "@/lib/api";
import {
  ShieldAlert,
  Layers,
  RefreshCw,
  LogOut,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Image as ImageIcon,
  Mic,
  Activity,
  UserCheck,
  Building2,
  Sparkles,
  Radio
} from "lucide-react";

interface RSKTicket {
  ticket_id: string;
  farm_id: number;
  health_report_id: string;
  disease_name: string;
  ai_confidence: number;
  severity: string;
  priority: string;
  symptoms: string[];
  image_path: string | null;
  audio_path: string | null;
  farmer_description: string | null;
  status: string;
  assigned_to: string | null;
  response: string | null;
  created_at: string;
  resolved_at: string | null;
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "urgent":
      return "bg-red-100/90 text-red-800 border-red-300";
    case "normal":
      return "bg-blue-100/90 text-blue-800 border-blue-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "open":
      return "bg-amber-100/90 text-amber-800 border-amber-300";
    case "resolved":
      return "bg-emerald-100/90 text-emerald-800 border-emerald-300";
    default:
      return "bg-slate-100 text-slate-800 border-slate-300";
  }
}

export default function RSKQueuePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ name: string; email: string; role?: string } | null>(null);
  const [tickets, setTickets] = useState<RSKTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [expertName, setExpertName] = useState("RSK Expert");

  const fetchTickets = async () => {
    setLoading(true);
    const apiBase = await getApiBase();
    try {
      const meRes = await authFetch(`${apiBase}/users/me`);
      if (!meRes.ok) {
        router.push("/login");
        return;
      }
      const userData = await meRes.json();
      if (userData.role !== "rsk_expert" && userData.role !== "insurance_admin") {
        router.push("/dashboard");
        return;
      }
      setUser(userData);
      if (userData.name) setExpertName(userData.name);
      const url = showAll ? `${apiBase}/api/rsk/all` : `${apiBase}/api/rsk/queue`;
      const res = await authFetch(url);
      if (res.ok) {
        const data = await res.json();
        setTickets(data);
      } else {
        router.push("/dashboard");
      }
    } catch {
      console.error("Failed to fetch tickets");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [showAll]);

  const handleRespond = async (ticketId: string) => {
    if (!responseText.trim()) return;

    const formData = new FormData();
    formData.append("ticket_id", ticketId);
    formData.append("response", responseText);
    formData.append("expert_name", expertName);

    const apiBase = await getApiBase();
    try {
      const res = await authFetch(`${apiBase}/api/rsk/respond`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        setRespondingTo(null);
        setResponseText("");
        fetchTickets();
      }
    } catch {
      console.error("Failed to respond");
    }
  };

  const handleLogout = async () => {
    const apiBase = await getApiBase();
    await authFetch(`${apiBase}/auth/logout`, { method: "POST" });
    router.push("/login");
  };

  const openTicketsCount = tickets.filter((t) => t.status === "open").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f9f4] via-[#e6f4ea] to-[#dcfce7] p-4 md:p-8 font-sans text-[#1a1c1e] relative overflow-hidden">
      {/* Decorative background blurs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-300/30 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#54de99]/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-6 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-white/85 backdrop-blur-md border border-white/60 rounded-3xl p-4 md:px-6 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#0f4d32] to-[#00351f] text-white flex items-center justify-center shadow-md">
              <Building2 className="w-5 h-5 text-[#54de99]" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-[#00351f]">RSK Expert Kendra Portal</p>
              <p className="text-xs text-[#556057]">
                Signed in as <span className="font-bold text-[#0f4d32]">{user?.name || "Expert"}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/admin")}
              className="rounded-2xl bg-white/90 border-[#c0c9c0]/60 text-[#0f4d32] hover:bg-[#f0f9f4] font-bold text-xs shadow-sm"
            >
              Admin Dashboard
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-2xl bg-red-50 text-red-700 hover:bg-red-100 border-red-200 font-bold text-xs shadow-sm flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" /> Logout
            </Button>
          </div>
        </div>

        {/* Hero Title Card */}
        <div className="bg-white/85 backdrop-blur-md border border-white/60 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f4d32] to-[#00351f] text-white flex items-center justify-center shadow-lg shrink-0 transform -rotate-2 hover:rotate-0 transition-transform">
              <ShieldAlert className="w-8 h-8 text-[#54de99]" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00351f] to-[#0f4d32]">
                Escalation & Expert Queue
              </h1>
              <p className="text-[#556057] font-medium mt-1 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#0f4d32]" />
                Review escalated crop health reports and dispatch closed-loop treatment plans
              </p>
            </div>
          </div>
        </div>

        {/* Closed-Loop Notice */}
        <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/10 border border-emerald-500/20 backdrop-blur-md rounded-2xl p-4 text-emerald-950 text-xs font-semibold flex items-center gap-3 shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-800 shrink-0">
            <Radio className="w-4 h-4 text-emerald-700 animate-pulse" />
          </div>
          <span>
            <strong className="font-extrabold text-emerald-950">Closed-Loop Gateway Active:</strong> When you submit an expert diagnosis or treatment plan below, an instant SMS & Voice advisory is dispatched directly to the farmer's registered phone!
          </span>
        </div>

        {/* Controls & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/60 shadow-sm">
            <button
              onClick={() => setShowAll(false)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                !showAll
                  ? "bg-gradient-to-r from-[#0f4d32] to-[#125c3c] text-white shadow-md"
                  : "text-[#556057] hover:bg-[#f0f9f4]"
              }`}
            >
              Open Queue ({openTicketsCount})
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                showAll
                  ? "bg-gradient-to-r from-[#0f4d32] to-[#125c3c] text-white shadow-md"
                  : "text-[#556057] hover:bg-[#f0f9f4]"
              }`}
            >
              All Tickets ({tickets.length})
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchTickets}
            disabled={loading}
            className="rounded-2xl bg-white/90 border-[#c0c9c0]/60 text-[#0f4d32] hover:bg-[#f0f9f4] font-bold text-xs shadow-sm flex items-center gap-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Queue
          </Button>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="py-16 flex justify-center items-center gap-3">
            <div className="w-5 h-5 border-2 border-[#0f4d32] border-t-transparent rounded-full animate-spin"></div>
            <span className="font-bold text-[#0f4d32] text-sm">Loading queue tickets...</span>
          </div>
        ) : tickets.length === 0 ? (
          <Card className="bg-white/85 backdrop-blur-md border border-white/60 shadow-xl rounded-3xl overflow-hidden">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3 opacity-75" />
              <p className="text-lg font-extrabold text-[#1a1c1e]">Queue is clear</p>
              <p className="text-xs text-[#64748b] mt-1">No pending escalated crop health tickets at this moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => {
              const isUrgent = ticket.priority === "urgent" && ticket.status === "open";
              const isOpen = ticket.status === "open";

              return (
                <Card
                  key={ticket.ticket_id}
                  className={`bg-white/85 backdrop-blur-md shadow-xl rounded-3xl border transition-all duration-300 overflow-hidden ${
                    isUrgent
                      ? "border-red-300 ring-2 ring-red-400/30 bg-red-50/20"
                      : isOpen
                      ? "border-amber-200/80 hover:border-emerald-300"
                      : "border-white/60 opacity-85"
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                      
                      {/* Left Info Area */}
                      <div className="flex-grow space-y-4">
                        
                        {/* Header Pills */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs font-black text-[#0f4d32] bg-[#f0f9f4] px-3 py-1 rounded-xl border border-[#c0c9c0]/50">
                            {ticket.ticket_id}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider border ${getPriorityBadge(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase tracking-wider border ${getStatusBadge(
                              ticket.status
                            )}`}
                          >
                            {ticket.status}
                          </span>
                        </div>

                        {/* Disease & Confidence */}
                        <div>
                          <p className="text-xl font-extrabold text-[#1a1c1e] flex items-center gap-2">
                            <Activity className="w-5 h-5 text-red-500" />
                            {ticket.disease_name}
                          </p>
                          <p className="text-xs text-[#556057] font-medium mt-1">
                            AI Confidence: <strong className="text-[#0f4d32]">{(ticket.ai_confidence * 100).toFixed(1)}%</strong> &bull; Severity: <strong className="capitalize">{ticket.severity}</strong> &bull; Farm #{ticket.farm_id}
                          </p>
                        </div>

                        {/* Symptoms */}
                        {ticket.symptoms.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {ticket.symptoms.map((s) => (
                              <span
                                key={s}
                                className="px-3 py-1 rounded-xl bg-[#f0f9f4] text-[#0f4d32] text-xs font-bold border border-[#c0c9c0]/40"
                              >
                                {s}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Farmer Description */}
                        {ticket.farmer_description && (
                          <div className="bg-[#f8fafc] rounded-2xl p-4 text-xs text-[#334155] border border-[#e2e8f0]">
                            <span className="font-extrabold text-[#0f4d32] block mb-1">
                              Farmer Note:
                            </span>
                            {ticket.farmer_description}
                          </div>
                        )}

                        {/* Media indicators */}
                        <div className="flex items-center gap-4 text-xs font-bold">
                          {ticket.image_path && (
                            <span className="text-emerald-700 flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-600" /> Photo attached
                            </span>
                          )}
                          {ticket.audio_path && (
                            <span className="text-blue-700 flex items-center gap-1.5 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200">
                              <Mic className="w-3.5 h-3.5 text-blue-600" /> Voice recording attached
                            </span>
                          )}
                        </div>

                        {/* Resolved Response Display */}
                        {ticket.status === "resolved" && ticket.response && (
                          <div className="bg-emerald-50/90 rounded-2xl p-4 border border-emerald-200 shadow-sm space-y-1">
                            <p className="text-xs text-emerald-800 font-extrabold flex items-center gap-1.5">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              Expert Recommendation by {ticket.assigned_to || "RSK Kendra"}
                            </p>
                            <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                              {ticket.response}
                            </p>
                          </div>
                        )}

                        {/* Response Form */}
                        {ticket.status === "open" && respondingTo === ticket.ticket_id && (
                          <div className="space-y-3 pt-3 border-t border-[#e2e8f0] animate-in fade-in duration-300">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                placeholder="Expert name"
                                value={expertName}
                                onChange={(e) => setExpertName(e.target.value)}
                                className="w-full sm:w-60 rounded-xl border border-[#cbd5e1] px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#54de99]"
                              />
                            </div>
                            <textarea
                              placeholder="Write your expert diagnosis, recommended chemicals/remedies, and farmer treatment instructions..."
                              value={responseText}
                              onChange={(e) => setResponseText(e.target.value)}
                              rows={3}
                              className="w-full rounded-2xl border border-[#cbd5e1] p-3.5 text-xs text-[#1a1c1e] focus:outline-none focus:ring-2 focus:ring-[#54de99] shadow-inner"
                            />
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleRespond(ticket.ticket_id)}
                                className="rounded-xl bg-gradient-to-r from-[#0f4d32] to-[#125c3c] hover:from-[#00351f] hover:to-[#0f4d32] text-white font-bold text-xs shadow-md border-0 flex items-center gap-1.5"
                              >
                                <Send className="w-3.5 h-3.5" /> Submit & Dispatch SMS
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setRespondingTo(null)}
                                className="rounded-xl font-bold text-xs text-[#64748b]"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Action Button */}
                      {ticket.status === "open" && respondingTo !== ticket.ticket_id && (
                        <Button
                          size="sm"
                          onClick={() => setRespondingTo(ticket.ticket_id)}
                          className="rounded-2xl bg-gradient-to-r from-[#0f4d32] to-[#125c3c] hover:from-[#00351f] hover:to-[#0f4d32] text-white font-bold text-xs shadow-md border-0 shrink-0 self-start flex items-center gap-1.5 px-4 py-2"
                        >
                          <MessageSquare className="w-3.5 h-3.5" /> Reply & Prescribe
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
