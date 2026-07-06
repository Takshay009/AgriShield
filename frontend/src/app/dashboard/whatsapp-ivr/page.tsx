"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import Link from "next/link";

interface ChatMessage {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  timestamp: string;
}

const QUICK_MESSAGES = [
  { label: "🆘 Help Menu", body: "help" },
  { label: "🌾 Crop Suggest", body: "crop recommendation for my farm" },
  { label: "🌧️ Weather", body: "weather forecast for today" },
  { label: "🦠 Disease", body: "yellow spots on leaves, plant wilting" },
  { label: "🛡️ Insurance", body: "insurance claim status" },
  { label: "🌾 Hindi", body: "मेरी फसल में पीले धब्बे हैं" },
];

export default function WhatsAppIVRPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    setSending(true);
    setInputText("");

    // Add farmer message immediately
    const farmerMsg: ChatMessage = {
      id: `f_${Date.now()}`,
      direction: "inbound",
      body: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, farmerMsg]);

    try {
      const formData = new FormData();
      formData.append("From", "whatsapp:+919876543210");
      formData.append("Body", text);
      formData.append("NumMedia", "0");

      const res = await fetch("http://localhost:8000/webhooks/whatsapp-inbound", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        const botReply: ChatMessage = {
          id: data.reply_msg_id || `b_${Date.now()}`,
          direction: "outbound",
          body: data.ai_reply,
          timestamp: new Date().toISOString(),
        };
        setTimeout(() => {
          setMessages((prev) => [...prev, botReply]);
        }, 400);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          direction: "outbound",
          body: "⚠️ Backend offline. Start server: python -m uvicorn main:app --port 8000",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen apple-bg p-6 md:p-8">
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="apple-title">💬 WhatsApp & Indic Voice IVR Hub</h1>
          <p className="text-gray-500 mt-1">
            SMS-first farmers interact with AgriShield AI via WhatsApp Business chatbot & toll-free IVR hotline
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left: WhatsApp Chat Simulator */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="apple-card border-0 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                    🌾
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg font-bold">AgriShield WhatsApp Bot</CardTitle>
                    <CardDescription className="text-green-100 text-xs">
                      +91-1800-AGRI-SHIELD · Online · Twilio Business API
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>

              {/* Chat Messages */}
              <CardContent className="p-0">
                <div
                  className="h-[420px] overflow-y-auto p-4 space-y-3"
                  style={{ background: "linear-gradient(180deg, #e8f5e9 0%, #f1f8e9 100%)" }}
                >
                  {messages.length === 0 && (
                    <div className="text-center py-16 space-y-3">
                      <span className="text-5xl block">💬</span>
                      <p className="text-gray-600 font-semibold text-sm">
                        WhatsApp Business Chatbot Simulator
                      </p>
                      <p className="text-gray-500 text-xs max-w-xs mx-auto">
                        Type a message or use quick buttons below to simulate farmer interaction via WhatsApp
                      </p>
                    </div>
                  )}
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direction === "inbound" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300 ${
                          msg.direction === "inbound"
                            ? "bg-emerald-100 text-emerald-950 rounded-br-md"
                            : "bg-white text-gray-900 rounded-bl-md border border-gray-100"
                        }`}
                      >
                        <p className="whitespace-pre-wrap font-medium">{msg.body}</p>
                        <p className={`text-[10px] mt-1 ${msg.direction === "inbound" ? "text-emerald-600" : "text-gray-400"}`}>
                          {new Date(msg.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          {msg.direction === "inbound" ? " ✓✓" : " 🤖"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Message Buttons */}
                <div className="border-t border-gray-100 bg-white/80 px-4 py-3">
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {QUICK_MESSAGES.map((qm) => (
                      <button
                        key={qm.label}
                        onClick={() => sendMessage(qm.body)}
                        disabled={sending}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold transition-all duration-200 border border-emerald-200 hover:scale-105"
                      >
                        {qm.label}
                      </button>
                    ))}
                  </div>

                  {/* Input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && sendMessage(inputText)}
                      placeholder="Type a message in Hindi, Telugu, or English..."
                      className="flex-grow rounded-full border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                    <Button
                      onClick={() => sendMessage(inputText)}
                      disabled={sending || !inputText.trim()}
                      className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 shadow-md"
                    >
                      {sending ? "..." : "Send"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right: IVR & Info Panel */}
          <div className="lg:col-span-2 space-y-4">
            {/* IVR Hotline Card */}
            <Card className="apple-card border-0 shadow-lg bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700 text-white">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📞</span>
                  <div>
                    <h3 className="font-extrabold text-lg">Indic Voice IVR Hotline</h3>
                    <p className="text-indigo-200 text-xs">Toll-Free · Hindi · Telugu · Tamil</p>
                  </div>
                </div>
                <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-4 space-y-2">
                  <p className="text-2xl font-black tracking-wider text-center">
                    1800-AGRI-SHIELD
                  </p>
                  <p className="text-indigo-200 text-xs text-center">
                    +91-1800-274-7443 · 24/7 Toll-Free
                  </p>
                </div>
                <div className="space-y-1.5 text-xs">
                  <p className="font-bold text-indigo-100">IVR Menu Flow:</p>
                  <p className="text-indigo-200">1️⃣ Press 1 → Crop Recommendations</p>
                  <p className="text-indigo-200">2️⃣ Press 2 → Weather & Dry-Spell Alerts</p>
                  <p className="text-indigo-200">3️⃣ Press 3 → Report Crop Disease</p>
                  <p className="text-indigo-200">4️⃣ Press 4 → Insurance Claim Status</p>
                  <p className="text-indigo-200">5️⃣ Press 0 → Connect to RSK Expert</p>
                </div>
              </CardContent>
            </Card>

            {/* WhatsApp QR Card */}
            <Card className="apple-card border-0 shadow-lg">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">📱</span>
                  <div>
                    <h3 className="font-extrabold text-gray-900">WhatsApp Business</h3>
                    <p className="text-gray-500 text-xs">Scan QR or save number</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-2xl p-5 text-center space-y-2 border border-gray-100">
                  <div className="w-28 h-28 mx-auto bg-gradient-to-br from-emerald-100 to-green-100 rounded-2xl flex items-center justify-center text-5xl shadow-inner">
                    💬
                  </div>
                  <p className="text-xs text-gray-500 font-semibold">
                    wa.me/+911800AGRISHIELD
                  </p>
                </div>
                <div className="space-y-1.5 text-xs text-gray-600">
                  <p className="font-bold text-gray-800">SMS Commands:</p>
                  <p><span className="font-bold text-emerald-700">CROP</span> → Get crop recommendations</p>
                  <p><span className="font-bold text-emerald-700">WEATHER</span> → 7-day forecast</p>
                  <p><span className="font-bold text-emerald-700">DISEASE</span> + photo → AI diagnosis</p>
                  <p><span className="font-bold text-emerald-700">CLAIM</span> → Insurance status</p>
                  <p><span className="font-bold text-emerald-700">HELP</span> → Full menu</p>
                </div>
              </CardContent>
            </Card>

            {/* Bhashini TTS Card */}
            <Card className="apple-card border border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50/50">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🌐</span>
                  <div>
                    <h3 className="font-extrabold text-orange-950 text-sm">Bhashini TTS Integration</h3>
                    <p className="text-orange-700 text-[10px]">Text-to-Speech for IVR in Indic Languages</p>
                  </div>
                </div>
                <p className="text-xs text-orange-900 font-medium">
                  All IVR responses synthesized via Bhashini AI TTS engine in Hindi, Telugu, and Tamil. Farmers hear crop advisories in their native dialect over phone call!
                </p>
                <div className="flex gap-2">
                  <span className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded text-[10px] font-extrabold">HINDI</span>
                  <span className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded text-[10px] font-extrabold">TELUGU</span>
                  <span className="bg-orange-200 text-orange-900 px-2 py-0.5 rounded text-[10px] font-extrabold">TAMIL</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
