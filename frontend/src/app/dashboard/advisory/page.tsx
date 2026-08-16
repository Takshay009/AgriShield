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
import { getApiBase, getErrorMessage , authFetch} from "@/lib/api";

interface Farm {
  id: number;
  name: string;
  lat: string;
  lng: string;
}

interface ForecastDay {
  date: string;
  temp_max_c: number;
  temp_min_c: number;
  rainfall_mm: number;
  humidity_pct: number;
}

interface Alert {
  farm_id: number;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  start_date: string | null;
  duration_days: number | null;
  recommended_action: string | null;
  created_at: string;
}

interface AdvisoryData {
  farm_id: number;
  farm_name: string | null;
  lat: string;
  lng: string;
  forecast: ForecastDay[];
  alerts: Alert[];
  generated_at: string;
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case "high":
      return {
        bg: "bg-red-50 border-red-200",
        badge: "bg-red-100 text-red-800",
        icon: "🔴",
      };
    case "medium":
      return {
        bg: "bg-amber-50 border-amber-200",
        badge: "bg-amber-100 text-amber-800",
        icon: "🟠",
      };
    case "low":
      return {
        bg: "bg-blue-50 border-blue-200",
        badge: "bg-blue-100 text-blue-800",
        icon: "🔵",
      };
    case "info":
      return {
        bg: "bg-green-50 border-green-200",
        badge: "bg-green-100 text-green-800",
        icon: "🟢",
      };
    default:
      return {
        bg: "bg-gray-50 border-gray-200",
        badge: "bg-gray-100 text-gray-800",
        icon: "⚪",
      };
  }
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function getRainBar(mm: number): number {
  return Math.min(100, (mm / 50) * 100);
}

function getRainExplanation(mm: number): string {
  if (mm === 0) return "No Rain (Dry Day)";
  if (mm <= 5) return "Light Rain (Gentle Drizzle)";
  if (mm <= 35) return "Good Rain (Great for Crops)";
  return "Heavy Rain (Watch Drains!)";
}

function getHumidityExplanation(pct: number): string {
  if (pct < 30) return "Dry Air (Watch for bugs)";
  if (pct <= 70) return "Normal Air (Comfortable)";
  return "Sticky Air (High Moisture)";
}

export default function AdvisoryPage() {
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<AdvisoryData | null>(null);
  const [error, setError] = useState("");
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState("");

  useEffect(() => {
    (async () => {
      const apiBase = await getApiBase();
      authFetch(`${apiBase}/farms`, {
      })
        .then((res) => {
          if (!res.ok) throw new Error("Unauthorized");
          return res.json();
        })
        .then((farms) => {
          setFarms(farms);
          if (farms.length > 0) {
            setSelectedFarmId(farms[0].id);
            fetchAdvisoryWithBase(apiBase, farms[0].id);
          }
        })
        .catch(() => router.push("/login"));
    })();
  }, [router]);

  const fetchAdvisoryWithBase = async (apiBase: string, farmId: number) => {
    setLoading(true);
    setError("");
    setData(null);
    setBroadcastSuccess("");

    try {
      const res = await authFetch(`${apiBase}/api/advisory/${farmId}`,
        { }
      );
      if (!res.ok) {
        const err = await res.json();
        throw new Error(getErrorMessage(err, "Failed to fetch advisory"));
      }
      const result: AdvisoryData = await res.json();
      setData(result);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong"));
    } finally {
      setLoading(false);
    }
  };

  const handleFarmSelect = async (farmId: number) => {
    setSelectedFarmId(farmId);
    const apiBase = await getApiBase();
    fetchAdvisoryWithBase(apiBase, farmId);
  };

  const handleTestBroadcast = async () => {
    setBroadcasting(true);
    setBroadcastSuccess("");
    const apiBase = await getApiBase();
    try {
      const res = await authFetch(`${apiBase}/webhooks/sms-inbound`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          From: "+919876543210",
          Body: "FarmerPulse Test Alert: Weather advisory available for your farm.",
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBroadcastSuccess(`Alert dispatched via SMS gateway. Reply: ${data.reply?.status || "sent"}`);
      } else {
        setBroadcastSuccess("SMS gateway requires Twilio API configuration. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN in backend environment.");
      }
    } catch {
      setBroadcastSuccess("SMS gateway unavailable. Set Twilio credentials in backend environment.");
    } finally {
      setBroadcasting(false);
    }
  };

  const weatherAlerts = data?.alerts.filter((a) => a.alert_type !== "fertilization") || [];
  const fertAlerts = data?.alerts.filter((a) => a.alert_type === "fertilization") || [];

  return (
    <div className="min-h-screen apple-bg p-6 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header & Farm Selector */}
        <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-gray-100 pb-6">
            <div className="space-y-2">
              <Link
                href="/dashboard"
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full mb-1"
              >
                <span>←</span> Back to Dashboard
              </Link>
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
                <span>🌾</span> Simple Weather Warnings & Fertilizer Guide
              </h1>
              <p className="text-sm text-gray-500 max-w-2xl font-medium leading-relaxed">
                Easy-to-understand weather alerts and simple fertilizer advice (in bags, buckets, and spoons) for your farm
              </p>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0 self-start lg:self-center">
              <a
                href="https://wa.me/14155238886?text=Namaste!%20I%20have%20a%20question%20about%20my%20weather%20and%20fertilizer%20advisory"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-sm hover:shadow rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-200 flex items-center gap-2 hover:scale-[1.02]"
              >
                <span>💬 Ask AI on WhatsApp</span>
                <span className="text-[10px]">↗</span>
              </a>
              {data && (
                <Button
                  onClick={handleTestBroadcast}
                  disabled={broadcasting}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-sm hover:shadow rounded-2xl px-4 py-2.5 text-xs font-bold transition-all duration-200 flex items-center gap-2"
                >
                  {broadcasting ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      <span>Broadcasting...</span>
                    </>
                  ) : (
                    <>
                      <span>📢 Test SMS/Voice Alert</span>
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>

          {/* Farm Selector */}
          {farms.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider shrink-0">Select Farm:</span>
              <div className="flex flex-wrap gap-2">
                {farms.map((farm) => (
                  <button
                    key={farm.id}
                    onClick={() => handleFarmSelect(farm.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 flex items-center gap-1.5 ${
                      selectedFarmId === farm.id
                        ? "bg-gray-900 text-white shadow-md scale-[1.02]"
                        : "bg-gray-100/80 text-gray-600 hover:bg-gray-200/80"
                    }`}
                  >
                    <span>🏡</span>
                    {farm.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {farms.length === 0 && (
          <Card className="apple-card">
            <CardContent className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                Register a farm first to get advisories.
              </p>
              <Link href="/farms/new">
                <Button className="rounded-full">Add Farm</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {selectedFarmId && !data && !loading && (
          <div className="text-center py-8">
            <Button
              onClick={async () => { const apiBase = await getApiBase(); fetchAdvisoryWithBase(apiBase, selectedFarmId); }}
              className="rounded-full px-8 py-3 bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white shadow-lg"
            >
              📡 Fetch Advisory
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <svg
                className="animate-spin h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Fetching forecast & analyzing...
            </div>
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {data && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* 7-Day Forecast */}
            <Card className="apple-card border-0 shadow-lg bg-gradient-to-b from-blue-50/50 to-white">
              <CardHeader className="border-b border-blue-100/50 pb-4">
                <CardTitle className="text-xl font-bold text-blue-950">
                  📅 7-Day Weather Forecast — {data.farm_name}
                </CardTitle>
                <CardDescription className="text-blue-700/70 font-medium">
                  Expected temperature and rain for your farm field
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid gap-3">
                  {data.forecast.map((day, idx) => (
                    <div
                      key={day.date}
                      className={`flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3.5 rounded-xl transition-all duration-200 border border-gray-100 ${
                        idx === 0
                          ? "bg-blue-100/40 font-medium border-blue-200 shadow-sm"
                          : "hover:bg-gray-50 bg-white"
                      }`}
                    >
                      <div className="w-28 text-sm font-bold text-gray-800 flex-shrink-0">
                        {idx === 0 ? "Today" : formatDate(day.date)}
                      </div>

                      {/* Temperature with explanation */}
                      <div className="flex flex-col flex-grow min-w-[180px]">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-blue-600" title="Night/Morning Cool Temperature">
                            🌙 {day.temp_min_c}°C <span className="text-[10px] text-gray-500 font-normal">(Night Cool)</span>
                          </span>
                          <span className="text-red-600" title="Afternoon Peak Heat">
                            ☀️ {day.temp_max_c}°C <span className="text-[10px] text-gray-500 font-normal">(Day Heat)</span>
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden mt-1 shadow-inner">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-blue-400 via-yellow-400 to-red-500"
                            style={{
                              width: `${Math.min(100, Math.max(20, ((day.temp_max_c - day.temp_min_c) / 20) * 100))}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Rainfall with explanation */}
                      <div className="flex flex-col w-48 flex-shrink-0">
                        <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                          <span>🌧️ Rain: {day.rainfall_mm} mm</span>
                        </div>
                        <span className="text-[11px] font-semibold text-emerald-700">
                          {getRainExplanation(day.rainfall_mm)}
                        </span>
                      </div>

                      {/* Humidity with explanation */}
                      <div className="flex flex-col w-44 flex-shrink-0 sm:text-right">
                        <div className="text-xs font-bold text-blue-900">
                          💧 Air Moisture: {day.humidity_pct}%
                        </div>
                        <span className="text-[11px] text-gray-500 font-semibold">
                          {getHumidityExplanation(day.humidity_pct)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Side-by-Side Stack for Warnings and Fertilizer */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
              {/* Weather & Dry-Spell Alerts Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 px-1">
                  <span>🌦️ Important Weather Warnings</span>
                  <span className="text-xs bg-red-100 text-red-700 px-2.5 py-0.5 rounded-full font-bold shadow-sm">{weatherAlerts.length}</span>
                </h2>
                {weatherAlerts.length > 0 ? (
                  weatherAlerts.map((alert, idx) => {
                    const styles = getSeverityStyles(alert.severity);
                    return (
                      <Card
                        key={idx}
                        className={`apple-card border shadow-md hover:shadow-lg ${styles.bg} transition-all duration-300 transform hover:-translate-y-1`}
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0 mt-0.5">
                              {styles.icon}
                            </span>
                            <div className="flex-grow space-y-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-gray-900">
                                  {alert.title}
                                </h3>
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm ${styles.badge}`}
                                >
                                  {alert.severity.toUpperCase()}
                                </span>
                                {alert.duration_days && (
                                  <span className="text-xs font-medium text-gray-500">
                                    {alert.duration_days} day
                                    {alert.duration_days > 1 ? "s" : ""}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                {alert.message}
                              </p>
                              {alert.recommended_action && (
                                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-sm border border-gray-100 shadow-sm">
                                  <span className="font-bold text-gray-900 block mb-1">
                                    💡 What to do today:{" "}
                                  </span>
                                  <span className="text-gray-700 font-medium">
                                    {alert.recommended_action}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="apple-card border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-green-50/50">
                    <CardContent className="p-8 text-center flex flex-col items-center justify-center gap-3">
                      <span className="text-4xl drop-shadow-sm">✅</span>
                      <span className="text-emerald-800 font-semibold text-sm">
                        No critical dry spells or extreme weather hazards detected!
                      </span>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Fertilization Guidance Section */}
              <div className="space-y-4">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 px-1">
                  <span>🌱 Simple Fertilizer Guide</span>
                  <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold shadow-sm">{fertAlerts.length}</span>
                </h2>
                {fertAlerts.length > 0 ? (
                  fertAlerts.map((alert, idx) => {
                    return (
                      <Card
                        key={idx}
                        className="apple-card border-0 bg-gradient-to-br from-indigo-50/80 via-purple-50/30 to-white shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0 mt-0.5">
                              🧪
                            </span>
                            <div className="flex-grow space-y-3">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-indigo-950">
                                  {alert.title}
                                </h3>
                                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 shadow-sm">
                                  BEST TIME TO DO THIS
                                </span>
                                {alert.start_date && (
                                  <span className="text-xs font-medium text-indigo-400/80">
                                    Starts: {formatDate(alert.start_date)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-700 font-medium leading-relaxed">
                                {alert.message}
                              </p>
                              {alert.recommended_action && (
                                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4 text-sm border border-indigo-50 shadow-sm">
                                  <span className="font-bold text-indigo-900 block mb-1">
                                    🌱 How Much & How to Apply:{" "}
                                  </span>
                                  <span className="text-gray-700 font-medium">
                                    {alert.recommended_action}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                ) : (
                  <Card className="apple-card border-0 shadow-sm bg-gradient-to-br from-gray-50 to-slate-50">
                    <CardContent className="p-8 text-center flex flex-col items-center justify-center gap-3">
                      <span className="text-4xl drop-shadow-sm">😌</span>
                      <span className="text-gray-600 font-semibold text-sm">
                        No fertilizer needed right now! Soil and weather are good. Check back after rain.
                      </span>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
