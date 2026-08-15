"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import dynamic from "next/dynamic";
import { getApiBase, authFetch, getErrorMessage } from "@/lib/api";

// Next.js needs dynamic import for react-leaflet
const FarmMap = dynamic(() => import("@/components/FarmMap"), { ssr: false });

const STATES_LIST = [
  "Andhra Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];

export default function NewFarmPage() {
  const router = useRouter();

  // Tab State: 'lookup' or 'manual'
  const [activeTab, setActiveTab] = useState<"lookup" | "manual">("lookup");

  // Shared Form State
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [points, setPoints] = useState<[number, number][]>([]);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Lookup Specific State
  const [state, setState] = useState("");
  const [surveyNumber, setSurveyNumber] = useState("");
  const [ulpin, setUlpin] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [district, setDistrict] = useState("");
  const [taluka, setTaluka] = useState("");
  const [village, setVillage] = useState("");
  const [loading, setLoading] = useState(false);

  // Map Key to force Leaflet re-rendering on autofill centering
  const [mapKey, setMapKey] = useState(0);

  // Handle Land Record Lookup via API Adapter
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state) {
      setError("Please select a State.");
      return;
    }
    if (!surveyNumber && !ulpin) {
      setError("Please enter either a Survey Number or a ULPIN.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const apiBase = await getApiBase();
      let query = `state=${encodeURIComponent(state)}`;
      if (surveyNumber) query += `&survey_number=${encodeURIComponent(surveyNumber)}`;
      if (ulpin) query += `&ulpin=${encodeURIComponent(ulpin)}`;

      const res = await authFetch(`${apiBase}/api/land-records/lookup?${query}`, {
        method: "GET"
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to lookup land records");
      }

      const data = await res.json();
      
      // Auto-populate state
      setOwnerName(data.ownerName || "");
      setName(data.ownerName ? `${data.ownerName}'s Farm` : `Farm - Survey ${data.surveyNumber || surveyNumber}`);
      setArea(data.landArea || "");
      setDistrict(data.district || "");
      setTaluka(data.taluka || "");
      setVillage(data.village || "");
      
      if (data.polygon && data.polygon.length > 0) {
        setPoints(data.polygon);
      } else if (data.coordinates && data.coordinates.length === 2) {
        // Fallback to coordinates
        const lat = data.coordinates[0];
        const lng = data.coordinates[1];
        setPoints([[lat, lng], [lat + 0.001, lng], [lat + 0.001, lng + 0.001], [lat, lng + 0.001]]);
      }
      
      // Force unmount/remount map to center on new coordinates
      setMapKey((prev) => prev + 1);
      setSuccessMsg("Land record retrieved successfully! Please check the details and save.");
    } catch (err: any) {
      setError(`${err.message} You can switch to manual registration tab if needed.`);
    } finally {
      setLoading(false);
    }
  };

  // Submit and Save the Farm
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (points.length < 4) {
      setError("Please draw or load a boundary with 4 corners on the map.");
      return;
    }
    if (!name) {
      setError("Please enter a Farm Name.");
      return;
    }
    if (!area) {
      setError("Please enter the Farm Area.");
      return;
    }

    try {
      const payload = {
        name,
        area_hectares: area.toString(),
        boundary_geojson: JSON.stringify(points),
        lat: points[0][0].toString(),
        lng: points[0][1].toString(),
        survey_number: surveyNumber || null,
        ulpin: ulpin || null,
        state: state || null,
        district: district || null,
        taluka: taluka || null,
        village: village || null,
        registration_method: activeTab
      };

      const apiBase = await getApiBase();
      const res = await authFetch(`${apiBase}/farms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(getErrorMessage(errData, "Failed to register farm"));
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="outline" onClick={() => router.back()}>&larr; Back</Button>
        <Card className="shadow-lg border border-gray-200">
          <CardHeader className="bg-white border-b border-gray-100 rounded-t-lg pb-4">
            <CardTitle className="text-2xl font-bold text-gray-800">Register Your Farm</CardTitle>
            <CardDescription className="text-gray-500">Choose a method to register your farm details and boundary map.</CardDescription>
          </CardHeader>
          
          {/* Custom Navigation Tabs */}
          <div className="flex border-b border-gray-200 bg-white">
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMsg("");
                setActiveTab("lookup");
              }}
              className={`flex-1 py-3.5 text-center font-semibold text-sm border-b-2 transition-all ${
                activeTab === "lookup"
                  ? "border-green-600 text-green-600 bg-green-50/10"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
              }`}
            >
              Government Lookup
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setSuccessMsg("");
                setActiveTab("manual");
              }}
              className={`flex-1 py-3.5 text-center font-semibold text-sm border-b-2 transition-all ${
                activeTab === "manual"
                  ? "border-green-600 text-green-600 bg-green-50/10"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50/50"
              }`}
            >
              Manual Entry
            </button>
          </div>

          <CardContent className="p-6 bg-white rounded-b-lg">
            {/* Lookup Form */}
            {activeTab === "lookup" && (
              <form onSubmit={handleLookup} className="space-y-6 mb-8 pb-6 border-b border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                  <div className="space-y-2">
                    <Label htmlFor="stateSelect" className="text-gray-700 font-medium">State</Label>
                    <select
                      id="stateSelect"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      required
                      className="w-full h-10 px-3 border border-gray-300 rounded-md shadow-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    >
                      <option value="">Select State</option>
                      {STATES_LIST.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="surveyNumber" className="text-gray-700 font-medium">Survey Number</Label>
                    <Input
                      id="surveyNumber"
                      placeholder="e.g. 12/4A"
                      value={surveyNumber}
                      onChange={(e) => setSurveyNumber(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ulpin" className="text-gray-700 font-medium">ULPIN (Optional)</Label>
                    <Input
                      id="ulpin"
                      placeholder="14-digit identifier"
                      value={ulpin}
                      onChange={(e) => setUlpin(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" disabled={loading} className="w-full md:w-auto bg-green-600 hover:bg-green-700 text-white font-medium">
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        Fetching Details...
                      </span>
                    ) : (
                      "Fetch Details"
                    )}
                  </Button>
                </div>
              </form>
            )}

            {/* General Fields & Summary */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {activeTab === "lookup" && ownerName && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-md text-sm text-green-800 space-y-1">
                  <p className="font-semibold">Government Registry Details Found:</p>
                  <p>👤 <strong>Owner Name:</strong> {ownerName}</p>
                  <p>📍 <strong>Location:</strong> {village ? `${village}, ` : ""}{taluka ? `${taluka}, ` : ""}{district ? `${district}, ` : ""}{state}</p>
                  <p>📏 <strong>Area:</strong> {area} Hectares</p>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-medium">Farm Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="e.g. Patil Orchard, Village Paddy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="area" className="text-gray-700 font-medium">Area (Hectares)</Label>
                  <Input
                    id="area"
                    type="number"
                    step="0.01"
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    required
                    placeholder="e.g. 1.80"
                  />
                </div>
              </div>

              {/* Advanced location details for display/enrichment */}
              {(activeTab === "lookup" || district || taluka || village) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-500 text-xs">Village</Label>
                    <Input value={village} onChange={(e) => setVillage(e.target.value)} placeholder="Village" className="text-xs h-9 bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500 text-xs">Taluka</Label>
                    <Input value={taluka} onChange={(e) => setTaluka(e.target.value)} placeholder="Taluka" className="text-xs h-9 bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500 text-xs">District</Label>
                    <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="District" className="text-xs h-9 bg-gray-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-500 text-xs">State</Label>
                    <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="text-xs h-9 bg-gray-50" />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Boundary Map</Label>
                <FarmMap key={mapKey} initialPolygon={points} onPolygonChange={setPoints} />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-md shadow-sm">
                  {error}
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-md shadow-sm">
                  {successMsg}
                </div>
              )}

              <Button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 shadow-md">
                Confirm & Register Farm
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
