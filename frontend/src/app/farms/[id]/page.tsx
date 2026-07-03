"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import MetricsChart from "@/components/MetricsChart";

const FarmMap = dynamic(() => import("@/components/FarmMap"), { ssr: false });

export default function FarmDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [farm, setFarm] = useState<any>(null);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async (token: string) => {
    try {
      const res = await fetch(`http://localhost:8000/farms/${params.id}/metrics`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setMetrics(await res.json());
    } catch (err) {
      console.error(err);
    }
  };

  const [mintingNFT, setMintingNFT] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return router.push("/login");

    fetch(`http://localhost:8000/farms/${params.id}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error("Not found");
      return res.json();
    })
    .then(data => {
      data.points = JSON.parse(data.boundary_geojson);
      setFarm(data);
      fetchMetrics(token);
    })
    .catch(() => router.push("/dashboard"));
  }, [params.id, router]);

  const handleRefresh = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setRefreshing(true);
    try {
      const res = await fetch(`http://localhost:8000/farms/${params.id}/refresh-metrics`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) await fetchMetrics(token);
    } catch (err) {
      console.error(err);
    }
    setRefreshing(false);
  };

  const handleSubmitClaim = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:8000/claims`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ farm_id: params.id })
      });
      if (res.ok) {
        const claim = await res.json();
        router.push(`/claims/${claim.id}`);
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to submit claim");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMintNFT = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    setMintingNFT(true);
    try {
      const res = await fetch(`http://localhost:8000/farms/${params.id}/mint-nft`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const updatedFarm = await res.json();
        setFarm(updatedFarm);
      } else {
        const error = await res.json();
        alert(error.detail || "Failed to mint NFT");
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
    <div className="min-h-screen apple-bg p-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex gap-4 items-center">
            {farm.nft_url ? (
               <span className="text-sm font-semibold text-gray-900 bg-gray-100 px-4 py-2 rounded-full flex items-center gap-2">
                 <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"></path></svg>
                 Dynamic NFT Minted
               </span>
            ) : metrics.length > 0 && (
               <Button onClick={handleMintNFT} disabled={mintingNFT} className="rounded-full bg-black text-white hover:bg-gray-800">
                 {mintingNFT ? "Minting..." : "Mint NFT Badge"}
               </Button>
            )}
            <Button variant="outline" className="rounded-full" onClick={() => router.push("/dashboard")}>&larr; Dashboard</Button>
            <Button variant="outline" className="rounded-full" onClick={() => router.push("/claims")}>My Claims</Button>
        </div>
        <div className="flex justify-between items-center py-4">
          <h1 className="apple-title">{farm.name}</h1>
          <div className="flex gap-3">
            <Button className="rounded-full bg-gray-200 text-gray-900 hover:bg-gray-300" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? "Refreshing..." : "Refresh Metrics"}
            </Button>
            <Button className="rounded-full" onClick={handleSubmitClaim} disabled={!isHighRisk} variant={isHighRisk ? "default" : "outline"}>
              Submit Claim
            </Button>
          </div>
        </div>
        
        <div className="grid gap-8 md:grid-cols-3">
          <Card className="md:col-span-1 apple-card">
            <CardHeader className="p-6">
              <CardTitle>Farm Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-gray-500">Area</p>
                <p className="font-medium">{farm.area_hectares} hectares</p>
              </div>
              <div className="h-[200px] w-full rounded border overflow-hidden">
                <FarmMap initialPolygon={farm.points} readOnly />
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2 apple-card">
            <CardHeader className="p-6">
              <CardTitle>Current Weather & Risk</CardTitle>
            </CardHeader>
            <CardContent>
              {latestMetric ? (
                <div className="flex flex-wrap gap-8 mb-6">
                  <div>
                    <p className="text-gray-500 text-sm">Risk Level</p>
                    <span className={`inline-block px-3 py-1 mt-1 rounded-full text-xs font-semibold uppercase ${
                      latestMetric.risk_level === 'high' ? 'bg-red-100 text-red-700' :
                      latestMetric.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {latestMetric.risk_level} ({(parseFloat(latestMetric.risk_probability)*100).toFixed(0)}%)
                    </span>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">NDVI</p>
                    <p className="font-bold text-lg">{latestMetric.ndvi_avg}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Temp</p>
                    <p className="font-bold text-lg">{latestMetric.temp_c}°C</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Humidity</p>
                    <p className="font-bold text-lg">{latestMetric.humidity}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-sm">Rainfall</p>
                    <p className="font-bold text-lg">{latestMetric.rainfall_mm}mm</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm mb-6">No metrics available. Click refresh to fetch data.</p>
              )}
              
              <div className="h-[300px]">
                <MetricsChart metrics={metrics} />
              </div>
            </CardContent>
          </Card>
          {farm.nft_url && (
            <Card className="md:col-span-3 apple-card mt-2">
              <CardHeader className="bg-gray-50 border-b border-gray-100 p-6">
                <CardTitle>Dynamic NFT Badge</CardTitle>
              </CardHeader>
              <CardContent className="p-8 flex justify-center">
                <img src={`http://localhost:8000${farm.nft_url}`} alt="Dynamic Farm NFT" className="w-64 h-64 rounded-xl shadow-lg border-4 border-white transform transition duration-500 hover:scale-105" />
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
