"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

interface Farm {
  id: number;
  name: string;
}

interface DiagnosisResult {
  disease_name: string;
  confidence: number;
  severity: string;
  treatment: string;
  needs_escalation: boolean;
  model_used: string;
}

interface ReportResponse {
  report_id: string;
  farm_id: number;
  diagnosis: DiagnosisResult | null;
  symptoms_detected: string[];
  has_photo: boolean;
  has_audio: boolean;
  escalated: boolean;
  escalation_ticket: Record<string, unknown> | null;
  created_at: string;
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case "high":
      return "text-red-700 bg-red-50 border-red-200";
    case "medium":
      return "text-amber-700 bg-amber-50 border-amber-200";
    case "low":
      return "text-blue-700 bg-blue-50 border-blue-200";
    case "none":
      return "text-green-700 bg-green-50 border-green-200";
    default:
      return "text-gray-700 bg-gray-50 border-gray-200";
  }
}

export default function ReportIssuePage() {
  const router = useRouter();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [indicLang, setIndicLang] = useState("hi");
  const [simulatingSTT, setSimulatingSTT] = useState(false);
  const [sttTranscript, setSttTranscript] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReportResponse | null>(null);
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }
    fetch("http://localhost:8000/farms", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setFarms(data);
        if (data.length > 0) setSelectedFarmId(data[0].id);
      })
      .catch(() => {});
  }, [router]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onload = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      setError("Microphone access denied");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSimulateBhashiniSTT = () => {
    setSimulatingSTT(true);
    setSttTranscript("");
    setTimeout(() => {
      let indicText = "पत्ते पीले पड़ रहे हैं और भूरे धब्बे हैं, दोपहर में पौधा मुरझा रहा है।";
      let translatedText = "Leaves turning yellow with brown lesions, plant wilting during midday heat.";
      if (indicLang === "te") {
        indicText = "ఆకులు పసుపు రంగులోకి మారుతున్నాయి మరియు గోధుమ రంగు మచ్చలు ఉన్నాయి, మధ్యాహ్నం వేడిలో మొక్క వాడిపోతోంది.";
      } else if (indicLang === "ta") {
        indicText = "இலைகள் மஞ்சள் நிறமாக மாறி பழுப்பு நிற புள்ளிகளுடன் உள்ளன, நண்பகல் வெயிலில் செடி வாடுகிறது.";
      }
      setSttTranscript(`[Bhashini ${indicLang.toUpperCase()} STT]: "${indicText}" ➔ AI Diagnostic English: "${translatedText}"`);
      setDescription(translatedText);
      setSimulatingSTT(false);
    }, 1300);
  };

  const handleSubmit = async () => {
    if (!selectedFarmId) {
      setError("Select a farm first");
      return;
    }
    if (!photo && !description && !audioBlob) {
      setError("Provide at least a photo, description, or voice recording");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    const token = localStorage.getItem("token");
    if (!token) return;

    const formData = new FormData();
    formData.append("farm_id", String(selectedFarmId));
    formData.append("description", description);
    if (photo) formData.append("photo", photo);
    if (audioBlob) formData.append("audio", audioBlob, "recording.webm");

    try {
      const res = await fetch("http://localhost:8000/api/health-report", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Failed to submit report");
      }

      const data: ReportResponse = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen apple-bg p-6 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="apple-title">🔬 Report Crop Issue & Indic Voice Log</h1>
          <p className="text-gray-500 mt-1">
            Upload crop photos, describe symptoms, or record voice notes in regional Indic languages
          </p>
        </div>

        {/* Input Form */}
        <Card className="apple-card border-0 shadow-xl bg-white/95">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Issue Diagnosis Portal</CardTitle>
            <CardDescription>
              Connected directly to Rashtriya Seva Kisan (RSK) Kendras for expert closed-loop follow-up
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Farm selector */}
            {farms.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Select Farm Target:</Label>
                <div className="flex flex-wrap gap-2">
                  {farms.map((farm) => (
                    <button
                      key={farm.id}
                      onClick={() => setSelectedFarmId(farm.id)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                        selectedFarmId === farm.id
                          ? "bg-gray-900 text-white shadow-md scale-105"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {farm.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Bhashini Indic STT Section */}
            <div className="bg-gradient-to-br from-orange-50 via-amber-50/50 to-white border border-orange-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-orange-950 flex items-center gap-2 text-base">
                    <span>🌐 Bhashini AI Indic Speech-to-Text (STT)</span>
                    <span className="bg-orange-200 text-orange-900 text-[10px] font-extrabold px-2 py-0.5 rounded">HACKATHON REQUIREMENT</span>
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Speak or simulate logging crop health issues in local Indian dialects with automatic English translation
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={indicLang}
                    onChange={(e) => setIndicLang(e.target.value)}
                    className="bg-white border border-orange-300 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="hi">🇮🇳 Hindi (हिन्दी)</option>
                    <option value="te">🇮🇳 Telugu (తెలుగు)</option>
                    <option value="ta">🇮🇳 Tamil (தமிழ்)</option>
                  </select>
                  <Button
                    type="button"
                    onClick={handleSimulateBhashiniSTT}
                    disabled={simulatingSTT}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-xl px-4 py-2 text-xs font-bold shadow-md transition-all duration-300 flex items-center gap-1.5"
                  >
                    {simulatingSTT ? (
                      <>
                        <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <span>Translating Dialect...</span>
                      </>
                    ) : (
                      <>
                        <span>🎙️ Simulate Indic Voice Log</span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {sttTranscript && (
                <div className="bg-white/90 border border-orange-200 rounded-xl p-3.5 text-xs text-orange-950 font-medium shadow-inner animate-in fade-in duration-300">
                  <span className="font-bold text-orange-800">✨ Bhashini Translation Result: </span>
                  {sttTranscript}
                </div>
              )}
            </div>

            {/* Photo upload */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                📷 Crop Photo Diagnosis (ResNet18 / Vision AI)
              </Label>
              <div className="flex items-center gap-4">
                <label className="cursor-pointer flex items-center gap-2 px-5 py-3.5 rounded-2xl border-2 border-dashed border-gray-300 hover:border-emerald-500 transition-colors bg-gray-50/50 hover:bg-emerald-50/20">
                  <span className="text-2xl">📸</span>
                  <span className="text-sm font-medium text-gray-700">
                    {photo ? photo.name : "Choose crop photo or take picture"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </label>
                {photoPreview && (
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover border shadow-sm"
                  />
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                ✍️ Diagnostic Symptoms (English / Translated)
              </Label>
              <textarea
                placeholder="e.g., Leaves are turning yellow with brown spots, plant wilting in afternoon..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
              />
            </div>

            {/* Voice recording */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">
                🎙️ Raw Browser Voice Recording (optional)
              </Label>
              <div className="flex items-center gap-3">
                {!isRecording ? (
                  <Button
                    variant="outline"
                    onClick={startRecording}
                    className="rounded-full border-gray-300 font-semibold"
                  >
                    🎤 Start Microphone Recording
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    onClick={stopRecording}
                    className="rounded-full animate-pulse font-semibold"
                  >
                    ⏹️ Stop Recording
                  </Button>
                )}
                {audioBlob && (
                  <span className="text-sm text-emerald-700 font-semibold bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    ✅ Audio Clip Attached ({(audioBlob.size / 1024).toFixed(0)} KB)
                  </span>
                )}
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-50 px-4 py-2 rounded-xl">
                {error}
              </div>
            )}

            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="rounded-full px-8 py-3 bg-gradient-to-r from-red-600 to-orange-500 hover:from-red-700 hover:to-orange-600 text-white shadow-lg hover:shadow-xl transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4"
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
                  Analyzing...
                </span>
              ) : (
                "🔍 Submit & Diagnose"
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Diagnosis card */}
            {result.diagnosis && (
              <Card
                className={`apple-card border ${getSeverityColor(
                  result.diagnosis.severity
                )}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-4xl">
                      {result.diagnosis.severity === "none"
                        ? "✅"
                        : result.diagnosis.severity === "high"
                        ? "🚨"
                        : "⚠️"}
                    </span>
                    <div>
                      <h3 className="text-xl font-bold">
                        {result.diagnosis.disease_name}
                      </h3>
                      <p className="text-sm opacity-80">
                        Confidence: {(result.diagnosis.confidence * 100).toFixed(1)}%
                        · Severity: {result.diagnosis.severity}
                      </p>
                    </div>
                  </div>
                  <div className="bg-white/60 rounded-xl p-4">
                    <p className="text-sm font-medium mb-1">
                      💊 Recommended Treatment
                    </p>
                    <p className="text-sm">{result.diagnosis.treatment}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Symptoms detected */}
            {result.symptoms_detected.length > 0 && (
              <Card className="apple-card">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">
                    🔎 Symptoms Detected
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.symptoms_detected.map((s) => (
                      <span
                        key={s}
                        className="px-3 py-1 rounded-full bg-gray-100 text-sm text-gray-700"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Escalation notice */}
            {result.escalated && result.escalation_ticket && (
              <Card className="apple-card border border-red-200 bg-red-50">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">🆘</span>
                    <div>
                      <h3 className="font-bold text-red-800">
                        Escalated to RSK Expert
                      </h3>
                      <p className="text-sm text-red-600">
                        Ticket:{" "}
                        {(result.escalation_ticket as Record<string, string>)
                          .ticket_id || "N/A"}{" "}
                        · A Rashtriya Seva Kisan expert will review your case
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Report meta */}
            <div className="flex flex-wrap gap-3 text-sm text-gray-500">
              <span className="px-3 py-1 bg-gray-100 rounded-full">
                Report: {result.report_id}
              </span>
              {result.has_photo && (
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full">
                  📷 Photo attached
                </span>
              )}
              {result.has_audio && (
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full">
                  🎙️ Audio attached
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
