"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import dynamic from "next/dynamic";
import MetricsChart from "@/components/MetricsChart";
import { getApiBase, getErrorMessage , authFetch} from "@/lib/api";
import { Map, Leaf, Trash2, Edit3, RefreshCw, AlertTriangle, ShieldCheck, ArrowLeft, Medal, Activity, MapPin, Droplets, Thermometer, CloudRain, ShieldAlert } from "lucide-react";

const FarmMap = dynamic(() => import("@/components/FarmMap"), { ssr: false });

export default function FarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [farm, setFarm] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetricsWithBase = async (apiBase: string) => {
    try {
      const res = await authFetch(`${apiBase}/farms/${params.id}/metrics`);
      if (res.ok) setMetrics(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMetrics = async () => {
    const apiBase = await getApiBase();
    return fetchMetricsWithBase(apiBase);
  };

  const [mintingNFT, setMintingNFT] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editArea, setEditArea] = useState("");
  const [editPoints, setEditPoints] = useState<[number, number][]>([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [resolvedBase, setResolvedBase] = useState("");

  useEffect(() => {
    getApiBase().then(setResolvedBase);
  }, []);

  useEffect(() => {
    (async () => {
      const apiBase = await getApiBase();
      authFetch(`${apiBase}/farms/${params.id}`)
      .then(res => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then(data => {
        data.points = data.boundary_geojson ? JSON.parse(data.boundary_geojson) : [];
        setFarm(data);
        setEditName(data.name || "");
        setEditArea(data.area_hectares || "");
        setEditPoints(data.points || []);
        fetchMetricsWithBase(apiBase);
      })
      .catch(() => router.push("/login"));
    })();
  }, [params.id, router]);

  const handleSaveEdit = async () => {
    if (editPoints.length < 4) {
      alert("Please draw a 4-sided polygon on the map.");
      return;
    }
    setSavingEdit(true);
    const apiBase = await getApiBase();
    try {
      const payload = {
        name: editName,
        area_hectares: editArea,
        boundary_geojson: JSON.stringify(editPoints),
        lat: editPoints[0][0].toString(),
        lng: editPoints[0][1].toString()
      };
      const res = await authFetch(`${apiBase}/farms/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const updated = await res.json();
        updated.points = JSON.parse(updated.boundary_geojson);
        setFarm(updated);
        setIsEditing(false);
      } else {
        alert("Failed to update farm");
      }
    } catch (err) {
      console.error(err);
    }
    setSavingEdit(false);
  };

  const handleDeleteFarm = async () => {
    if (!window.confirm("⚠️ Are you sure you want to permanently delete this farm and all associated records?")) {
      return;
    }
    const apiBase = await getApiBase();
    try {
      const res = await authFetch(`${apiBase}/farms/${params.id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        router.push("/dashboard");
      } else {
        alert("Failed to delete farm");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const apiBase = await getApiBase();
    try {
      const res = await authFetch(`${apiBase}/farms/${params.id}/refresh-metrics`, {
        method: "POST"
      });
      if (res.ok) await fetchMetrics();
    } catch (err) {
      console.error(err);
    }
    setRefreshing(false);
  };

  const handleSubmitClaim = async () => {
    const apiBase = await getApiBase();
    try {
      const res = await authFetch(`${apiBase}/claims`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ farm_id: params.id })
      });
      if (res.ok) {
        const claim = await res.json();
        router.push(`/claims/${claim.id}`);
      } else {
        const error = await res.json();
        alert(getErrorMessage(error, "Failed to submit claim"));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMintNFT = async () => {
    setMintingNFT(true);
    const apiBase = await getApiBase();
    try {
      const res = await authFetch(`${apiBase}/farms/${params.id}/mint-nft`, {
        method: "POST"
      });
      if (res.ok) {
        const updatedFarm = await res.json();
        setFarm(updatedFarm);
      } else {
        const error = await res.json();
        alert(getErrorMessage(error, "Failed to mint NFT"));
      }
    } catch (err) {
      console.error(err);
    }
    setMintingNFT(false);
  };

  if (!farm) return <div className="p-8 text-center">Loading...</div>;

  const latestMetric = metrics.length > 0 ? metrics[metrics.length - 1] : null;
  const isHighRisk = latestMetric && parseFloat(latestMetric.risk_probability) >= 0.6;

  return (
    <div className="bg-gradient-to-br from-[#f0f9f4] to-[#e6f4ea] min-h-screen flex flex-col font-sans text-[#1a1c1e] relative overflow-hidden p-4 md:p-8">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
      <div className="fixed z-0 blur-[120px] opacity-30 pointer-events-none bg-gradient-to-r from-[#006d43] to-[#0f4d32] w-[400px] h-[400px] rounded-full -top-20 -left-20"></div>
      <div className="fixed z-0 blur-[120px] opacity-30 pointer-events-none bg-gradient-to-br from-[#54de99] to-[#00351f] w-[300px] h-[300px] rounded-full bottom-10 -right-10"></div>

      <div className="max-w-[1200px] mx-auto w-full z-10 relative space-y-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Top Action Bar */}
        <div className="flex flex-wrap gap-4 items-center justify-between bg-white/80 backdrop-blur-md border border-white/50 p-4 md:p-5 rounded-3xl shadow-md">
          <div className="flex items-center gap-3">
            <Button variant="outline" className="rounded-xl border-[#c0c9c0] text-[#0f4d32] hover:bg-[#f0f9f4] font-bold shadow-sm" onClick={() => router.push("/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Dashboard
            </Button>
            <Button variant="outline" className="rounded-xl border-[#c0c9c0] text-[#0f4d32] hover:bg-[#f0f9f4] font-bold shadow-sm" onClick={() => router.push("/claims")}>
              <ShieldCheck className="w-4 h-4 mr-1.5" /> My Claims
            </Button>
          </div>
          <div>
            {farm.nft_url ? (
               <span className="text-xs font-extrabold text-[#00351f] bg-[#e8f7f0] px-4 py-2 rounded-xl flex items-center gap-2 border border-[#0f4d32]/20 shadow-sm uppercase tracking-wider">
                 <Medal className="w-4 h-4 text-[#54de99]" /> Dynamic NFT Minted
               </span>
            ) : metrics.length > 0 && (
               <Button onClick={handleMintNFT} disabled={mintingNFT} className="rounded-xl bg-gradient-to-r from-[#0f4d32] to-[#125c3c] text-white hover:from-[#00351f] hover:to-[#0f4d32] font-bold shadow-md transform transition-all hover:scale-105 border-0">
                 {mintingNFT ? "Minting..." : <><Medal className="w-4 h-4 mr-2" /> Mint NFT Badge</>}
               </Button>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="fixed inset-0 z-[5000] bg-[#00351f]/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col overflow-hidden border border-white/20 ring-1 ring-black/10">
              <div className="p-5 md:p-6 bg-gradient-to-r from-[#f8fafc] to-white border-b border-[#e5e7eb] flex justify-between items-center flex-wrap gap-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <h2 className="text-lg md:text-xl font-extrabold text-[#0f4d32] flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Fullscreen Map Edit
                  </h2>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="px-4 py-2 border border-[#cbd5e1] rounded-xl bg-white text-[#1a1c1e] font-bold text-sm w-48 md:w-60 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#54de99]"
                    placeholder="Farm Name"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.01"
                      value={editArea}
                      onChange={(e) => setEditArea(e.target.value)}
                      className="px-4 py-2 border border-[#cbd5e1] rounded-xl bg-white text-[#1a1c1e] font-bold text-sm w-24 md:w-28 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#54de99]"
                      placeholder="Area"
                    />
                    <span className="text-sm font-bold text-[#64748b]">ha</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button className="rounded-xl bg-gradient-to-r from-[#0f4d32] to-[#125c3c] hover:from-[#00351f] hover:to-[#0f4d32] text-white shadow-md font-bold px-6 border-0" onClick={handleSaveEdit} disabled={savingEdit}>
                    {savingEdit ? "Saving..." : "Save Changes"}
                  </Button>
                  <Button className="rounded-xl font-bold bg-[#f1f5f9] text-[#475569] hover:bg-[#e2e8f0] border-0" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="flex-1 p-4 md:p-6 overflow-hidden flex flex-col bg-[#f0f2f5] inner-shadow">
                <div className="flex-1 w-full h-full rounded-2xl overflow-hidden border border-[#cbd5e1] shadow-sm">
                  <FarmMap
                    initialPolygon={editPoints}
                    onPolygonChange={setEditPoints}
                    readOnly={false}
                    heightClassName="h-full min-h-[500px]"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Title and Farm Actions */}
        <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f4d32] to-[#00351f] text-white flex items-center justify-center shadow-lg shrink-0 transform rotate-[-3deg] hover:rotate-0 transition-transform">
              <MapPin className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00351f] to-[#0f4d32]">
                {farm.name}
              </h1>
              <p className="text-[#404943] font-medium mt-1 flex items-center gap-2">
                <Leaf className="w-4 h-4 text-[#54de99]" /> Precision Farm Profile
              </p>
            </div>
          </div>
          <div className="relative z-10 flex flex-wrap gap-3">
            <Button className="rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold shadow-sm" onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-1.5" /> Edit Farm
            </Button>
            <Button className="rounded-xl bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 font-bold shadow-sm" onClick={handleDeleteFarm}>
              <Trash2 className="w-4 h-4 mr-1.5" /> Delete
            </Button>
            <Button className="rounded-xl bg-white border border-[#c0c9c0] text-[#0f4d32] hover:border-[#0f4d32] hover:bg-[#f0f9f4] font-bold shadow-sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
            <Button className={`rounded-xl font-bold shadow-sm ${isHighRisk ? 'bg-gradient-to-r from-red-500 to-red-600 text-white border-0 hover:from-red-600 hover:to-red-700 shadow-md transform hover:-translate-y-0.5 transition-all' : 'bg-white border border-[#c0c9c0] text-gray-400'}`} onClick={handleSubmitClaim} disabled={!isHighRisk}>
              <ShieldAlert className="w-4 h-4 mr-1.5" /> Submit Claim
            </Button>
          </div>
        </div>
        
        {/* Cards Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1 bg-white/90 backdrop-blur-md border border-white/60 shadow-xl rounded-3xl overflow-hidden flex flex-col ring-1 ring-black/5">
            <CardHeader className="bg-gradient-to-r from-[#f0f9f4] to-white border-b border-[#e5e7eb] p-5">
              <CardTitle className="text-lg font-extrabold text-[#1a1c1e] flex items-center gap-2">
                <Map className="w-5 h-5 text-[#0f4d32]" /> Farm Details
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              <div className="bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] flex items-center justify-between shadow-sm">
                <p className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Total Area</p>
                <p className="font-extrabold text-lg text-[#0f4d32]">{farm.area_hectares} <span className="text-sm font-medium text-[#404943]">ha</span></p>
              </div>
              <div
                className="h-[280px] w-full rounded-2xl border-2 border-[#e5e7eb] overflow-hidden relative group cursor-pointer shadow-inner"
                onClick={() => setIsEditing(true)}
                title="Click to edit Map"
              >
                <FarmMap initialPolygon={farm.points} readOnly heightClassName="h-full" />
                <div className="absolute inset-0 bg-[#0f4d32]/0 group-hover:bg-[#0f4d32]/20 transition duration-300 z-[1000] flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100">
                  <span className="bg-white text-[#00351f] px-5 py-2.5 rounded-xl font-extrabold text-sm shadow-xl transform scale-95 group-hover:scale-100 transition duration-300 flex items-center gap-2 border border-white">
                    <Edit3 className="w-4 h-4 text-[#54de99]" /> Edit Boundary
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2 bg-white/90 backdrop-blur-md border border-white/60 shadow-xl rounded-3xl overflow-hidden ring-1 ring-black/5">
            <CardHeader className="bg-gradient-to-r from-[#f0f9f4] to-white border-b border-[#e5e7eb] p-5">
              <CardTitle className="text-lg font-extrabold text-[#1a1c1e] flex items-center gap-2">
                <Activity className="w-5 h-5 text-[#0f4d32]" /> Current Weather & Risk
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {latestMetric ? (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                  <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] text-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#cbd5e1] to-transparent"></div>
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-2 flex items-center justify-center gap-1"><AlertTriangle className="w-3 h-3"/> Risk Level</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold uppercase shadow-sm ${
                      latestMetric.risk_level === 'high' ? 'bg-red-100 text-red-700 border border-red-200' :
                      latestMetric.risk_level === 'medium' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                      'bg-green-100 text-green-700 border border-green-200'
                    }`}>
                      {latestMetric.risk_level} ({(parseFloat(latestMetric.risk_probability)*100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] text-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#54de99] to-transparent"></div>
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Leaf className="w-3 h-3 text-[#54de99]"/> NDVI</p>
                    <p className="font-black text-xl text-[#0f4d32]">{latestMetric.ndvi_avg}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] text-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-orange-400 to-transparent"></div>
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Thermometer className="w-3 h-3 text-orange-400"/> Temp</p>
                    <p className="font-black text-xl text-[#1a1c1e]">{latestMetric.temp_c}°</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] text-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><Droplets className="w-3 h-3 text-blue-400"/> Humidity</p>
                    <p className="font-black text-xl text-[#1a1c1e]">{latestMetric.humidity}%</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 border border-[#e2e8f0] text-center shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent"></div>
                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest mb-1 flex items-center justify-center gap-1"><CloudRain className="w-3 h-3 text-cyan-500"/> Rainfall</p>
                    <p className="font-black text-xl text-[#1a1c1e]">{latestMetric.rainfall_mm}<span className="text-[10px] text-[#64748b]">mm</span></p>
                  </div>
                </div>
              ) : (
                <div className="bg-[#f8fafc] border border-[#e2e8f0] border-dashed rounded-2xl p-8 text-center mb-6 shadow-inner">
                   <p className="text-[#64748b] font-medium text-sm flex items-center justify-center gap-2">
                     <AlertTriangle className="w-4 h-4 text-orange-400" />
                     No metrics available. Click refresh to fetch data.
                   </p>
                </div>
              )}
              
              <div className="h-[320px] bg-white rounded-2xl p-4 border border-[#e5e7eb] shadow-inner">
                <MetricsChart metrics={metrics} />
              </div>
            </CardContent>
          </Card>

          {farm.nft_url && (
            <Card className="md:col-span-3 bg-gradient-to-r from-[#00351f] to-[#0f4d32] border border-white/20 shadow-2xl rounded-3xl overflow-hidden relative text-white">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <CardHeader className="bg-black/20 border-b border-white/10 p-5 backdrop-blur-sm relative z-10">
                <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                  <Medal className="w-5 h-5 text-[#54de99]" /> Dynamic NFT Badge
                </CardTitle>
                <CardDescription className="text-[#a7f3d0] font-medium text-xs">A verifiable record of your farm's health on the blockchain.</CardDescription>
              </CardHeader>
              <CardContent className="p-8 flex justify-center relative z-10">
                <div className="p-2 bg-white/10 rounded-3xl backdrop-blur-md border border-white/20 shadow-2xl">
                  <img src={`${resolvedBase}${farm.nft_url}`} alt="Dynamic Farm NFT" className="w-72 h-72 rounded-2xl shadow-inner border-4 border-white/50 transform transition duration-500 hover:scale-105" />
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
