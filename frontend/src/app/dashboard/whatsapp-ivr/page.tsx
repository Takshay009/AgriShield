"use client";

import { useState, useEffect, useRef } from "react";
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
import { getApiBase , authFetch} from "@/lib/api";
import {
  ArrowLeft,
  MessageSquare,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Send,
  Smartphone,
  Settings,
  PhoneCall,
  Globe,
  Camera,
  Bot,
  ExternalLink,
  Plus,
  X,
  RefreshCw,
  FileImage,
  Sparkles,
  Zap,
  Check,
} from "lucide-react";

interface ChatMessage {
  id: string;
  direction: "inbound" | "outbound";
  body: string;
  timestamp: string;
  media_url?: string;
  action_type?: string;
  diagnosis?: {
    disease_name?: string;
    confidence?: number;
    severity?: string;
    treatment?: string;
    crop_type?: string;
  };
}

const SAMPLE_DISEASE_PHOTOS = [
  {
    label: "Demo Sample Image 1 (Brown Spot-like)",
    icon: <FileImage className="w-3.5 h-3.5 text-[#0f4d32]" />,
    url: "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___Early_blight/0012b9d2-2130-4a06-a834-b1f3af34f57e___RS_Erly.B%208389.JPG",
    queries: {
      en: "My crop leaves have spots, please check",
      hi: "मेरी फसल के पत्तों पर धब्बे दिखाई दे रहे हैं, कृपया जांच करें",
      te: "నా పంట ఆకులపై మచ్చలు కనిపిస్తున్నాయి, దయచేసి తనిఖీ చేయండి",
      mr: "माझ्या पिकाच्या पानांवर डाग दिसत आहेत, कृपया तपासा",
      ta: "என் பயிர் இலைகளில் புள்ளிகள் உள்ளன, தயவுசெய்து சரிபார்க்கவும்"
    } as Record<string, string>
  },
  {
    label: "Demo Sample Image 2 (Leaf Spot-like)",
    icon: <FileImage className="w-3.5 h-3.5 text-[#0f4d32]" />,
    url: "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___Septoria_leaf_spot/000146ff-92a4-4db6-90ad-8fce2ae4fded___JR_Sept.L.S%202799.JPG",
    queries: {
      en: "There are spots on my crop",
      hi: "मेरी फसल पर घाव/धब्बे बने हुए हैं",
      te: "నా పంట ఆకులపై మచ్చలు ఉన్నాయి",
      mr: "माझ्या पिकावर डाग पडले आहेत",
      ta: "என் பயிரில் புண்கள் உள்ளன"
    } as Record<string, string>
  },
  {
    label: "Demo Sample Image 3 (Healthy-like)",
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-[#0f4d32]" />,
    url: "https://raw.githubusercontent.com/spMohanty/PlantVillage-Dataset/master/raw/color/Tomato___healthy/000146ff-92a4-4db6-90ad-8fce2ae4fded___GH_HLAF_2799.JPG",
    queries: {
      en: "Please check my crop health",
      hi: "कृपया मेरी फसल के स्वास्थ्य की जांच करें",
      te: "దయచేసి నా పంట ఆరోగ్యాన్ని తనిఖీ చేయండి",
      mr: "कृपया माझ्या पिकाचे आरोग्य तपासा",
      ta: "என் பயிர் ஆரோக்கியத்தை சரிபார்க்கவும்"
    } as Record<string, string>
  },
];

const QUICK_QUESTIONS = [
  {
    label: "7-Day Weather Alert",
    queries: {
      en: "What is the 7-day weather forecast?",
      hi: "अगले 7 दिनों का मौसम पूर्वानुमान क्या है?",
      te: "7 రోజుల వాతావరణ సూచన ఏమిటి?",
      mr: "पुढील ७ दिवसांचा हवामान अंदाज काय आहे?",
      ta: "7 நாள் வானிலை முன்னறிவிப்பு என்ன?"
    } as Record<string, string>
  },
  {
    label: "Best Kharif Crop",
    queries: {
      en: "Which is the best crop for black soil?",
      hi: "काली मिट्टी के लिए सबसे अच्छी फसल कौन सी है?",
      te: "నల్ల రేగడి నేలలో ఏ పంట వేయాలి?",
      mr: "काळ्या मातीसाठी सर्वोत्तम पीक कोणते आहे?",
      ta: "கரிசல் மண்ணுக்கு சிறந்த பயிர் எது?"
    } as Record<string, string>
  },
  {
    label: "ZKP Claim Status",
    queries: {
      en: "What is my ZKP insurance claim status?",
      hi: "मेरा ZKP बीमा दावा स्थिति क्या है?",
      te: "నా ZKP భీమా క్లెయిమ్ స్థితి ఏమిటి?",
      mr: "माझा ZKP विमा दावा स्थिती काय आहे?",
      ta: "என் ZKP காப்பீட்டு கோரிக்கை நிலை என்ன?"
    } as Record<string, string>
  },
  {
    label: "Help Menu",
    queries: {
      en: "help",
      hi: "help",
      te: "help",
      mr: "help",
      ta: "help"
    } as Record<string, string>
  },
];

const LANGUAGES = [
  { code: "hi", name: "हिन्दी (Hindi)", cmd: "1" },
  { code: "te", name: "తెలుగు (Telugu)", cmd: "2" },
  { code: "mr", name: "मराठी (Marathi)", cmd: "3" },
  { code: "ta", name: "தமிழ் (Tamil)", cmd: "4" },
  { code: "en", name: "English", cmd: "5" },
];

export default function WhatsAppIVRPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [customMediaUrl, setCustomMediaUrl] = useState("");
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeLang, setActiveLang] = useState("hi");
  const [simPhone, setSimPhone] = useState("+919876543210");
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [resolvedBase, setResolvedBase] = useState("");
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  useEffect(() => {
    getApiBase().then(setResolvedBase);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const apiBase = await getApiBase();
      if (cancelled) return;
      authFetch(`${apiBase}/users/me`)
      .then(res => {
        if (!res.ok) throw new Error("Unauthorized");
      })
      .catch(() => {
        if (!cancelled) {
          router.push("/login?redirect=/dashboard/whatsapp-ivr");
        }
      });
    })();

    // Load initial welcome message
    setMessages([
      {
        id: "welcome_1",
        direction: "outbound",
        body: "नमस्ते! मैं कृषि शील्ड AI (FarmerPulse AI) हूँ। आप मुझसे खेती से जुड़ा कोई भी सवाल पूछ सकते हैं, मौसम की जानकारी ले सकते हैं, या अपनी फसल की फोटो भेजकर रोग की पहचान (ResNet18 Vision AI) करवा सकते हैं!\n\nभाषा बदलने के लिए नीचे दिए गए भाषा बटन दबाएं।",
        timestamp: new Date().toISOString(),
      },
    ]);

    return () => { cancelled = true; };
  }, [router]);

  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }, [messages, sending]);

  const sendSimulationMessage = async (
    text: string,
    mediaUrl: string = "",
    langCode: string = activeLang
  ) => {
    if (!text.trim() && !mediaUrl.trim()) return;
    setSending(true);
    setInputText("");
    if (mediaUrl) {
      setCustomMediaUrl("");
      setShowMediaInput(false);
    }

    const userMsg: ChatMessage = {
      id: `in_${Date.now()}`,
      direction: "inbound",
      body: text || "[Photo Uploaded for AI Diagnosis]",
      media_url: mediaUrl || undefined,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const apiBase = await getApiBase();
      const res = await authFetch(`${apiBase}/api/whatsapp/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: simPhone,
          message: text,
          media_url: mediaUrl || null,
          language: langCode,
        }),
      });

      if (res.ok) {
        setIsServerOnline(true);
        const data = await res.json();
        
        if (data.action_type === "language_switch" || langCode !== activeLang) {
          setActiveLang(data.language || langCode);
        }

        const botReply: ChatMessage = {
          id: data.reply_msg_id || `out_${Date.now()}`,
          direction: "outbound",
          body: data.ai_reply,
          timestamp: new Date().toISOString(),
          action_type: data.action_type,
          diagnosis: data.diagnosis,
        };

        setTimeout(() => {
          setMessages((prev) => [...prev, botReply]);
        }, 300);
      } else {
        throw new Error("Backend simulation error");
      }
    } catch {
      setIsServerOnline(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          direction: "outbound",
          body: "Backend Server Offline or Unreachable. Please ensure FastAPI is running on port 8000: `python -m uvicorn main:app --port 8000`",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleLanguageSwitch = (lang: typeof LANGUAGES[0]) => {
    setActiveLang(lang.code);
    sendSimulationMessage(lang.cmd, "", lang.code);
  };

  return (
    <div className="bg-gradient-to-br from-[#f0f9f4] to-[#e6f4ea] min-h-screen flex flex-col font-sans text-[#1a1c1e] relative overflow-hidden p-4 md:p-8">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 z-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20 pointer-events-none"></div>
      <div 
        className="fixed z-0 blur-[120px] opacity-30 pointer-events-none bg-gradient-to-r from-[#006d43] to-[#0f4d32] w-[500px] h-[500px] rounded-full -top-32 -left-32 transition-transform duration-700 ease-out"
        style={{ transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` }}
      ></div>
      <div 
        className="fixed z-0 blur-[120px] opacity-30 pointer-events-none bg-gradient-to-br from-[#54de99] to-[#00351f] w-[400px] h-[400px] rounded-full bottom-10 -right-20 transition-transform duration-700 ease-out"
        style={{ transform: `translate(${mousePos.x * -30}px, ${mousePos.y * -30}px)` }}
      ></div>

      <div className="max-w-[1400px] mx-auto w-full z-10 relative space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
        
        {/* Header Section */}
        <div className="bg-white/80 backdrop-blur-md border border-white/50 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/40 to-transparent pointer-events-none"></div>
          <div className="relative z-10 flex flex-col items-start gap-4">
            <Link
              href="/dashboard"
              className="text-xs font-extrabold uppercase tracking-widest text-[#0f4d32] hover:text-[#00351f] bg-[#e8f7f0] px-4 py-1.5 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#0f4d32] to-[#00351f] text-white flex items-center justify-center shadow-lg shrink-0 transform rotate-[-3deg] hover:rotate-0 transition-transform">
                <MessageSquare className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00351f] to-[#0f4d32]">
                  FarmerPulse AI & IVR Hub
                </h1>
                <p className="text-[#404943] font-medium mt-1 md:text-lg flex flex-wrap gap-2 items-center">
                  24/7 Smart Advisory via <span className="inline-flex items-center gap-1 bg-[#e8f7f0] text-[#0f4d32] px-2 py-0.5 rounded-md font-bold text-sm"><Smartphone className="w-3.5 h-3.5"/> WhatsApp</span> & <span className="inline-flex items-center gap-1 bg-[#e8f7f0] text-[#0f4d32] px-2 py-0.5 rounded-md font-bold text-sm"><PhoneCall className="w-3.5 h-3.5"/> Voice IVR</span>
                </p>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-4 py-2 rounded-xl bg-white border border-[#c0c9c0] shadow-sm text-[#0f4d32] text-sm font-bold flex items-center gap-2 hover:border-[#0f4d32] transition-colors">
                <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#54de99] opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-[#0f4d32]"></span></span>
                Twilio Online
              </div>
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f0f9f4] to-white border border-[#c0c9c0] shadow-sm text-[#00351f] text-sm font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#0f4d32]" /> Groq LLM
              </div>
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f0f9f4] to-white border border-[#c0c9c0] shadow-sm text-[#00351f] text-sm font-bold flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#0f4d32]" /> Vision AI
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          
          {/* Left Column: Interactive Chat Sandbox */}
          <div className="flex flex-col gap-6">
            
            <Card className="flex-1 bg-white/90 backdrop-blur-md border border-white/60 shadow-xl rounded-3xl overflow-hidden flex flex-col h-[650px] ring-1 ring-black/5">
              
              {/* WhatsApp Header Modernized */}
              <div className="bg-gradient-to-r from-[#00351f] via-[#0f4d32] to-[#125c3c] p-5 flex items-center justify-between shadow-md relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-full bg-white opacity-5 transform skew-x-[-20deg]"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 rounded-full bg-white p-1 shadow-lg">
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-[#0f4d32] to-[#54de99] flex items-center justify-center text-white">
                      <Bot className="w-6 h-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-lg flex items-center gap-2">
                      FarmerPulse Scientist
                      <span className="bg-[#54de99]/20 text-[#54de99] text-[10px] px-2 py-0.5 rounded-full font-extrabold uppercase tracking-wider border border-[#54de99]/30">
                        BOT
                      </span>
                    </h3>
                    <p className="text-[#a7f3d0] text-sm flex items-center gap-2 font-medium mt-0.5">
                      <span className="w-2 h-2 rounded-full bg-[#54de99] shadow-[0_0_8px_#54de99]"></span>
                      Twilio Verified
                    </p>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-3 bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-[#a7f3d0] text-sm font-bold flex items-center gap-1"><Smartphone className="w-4 h-4"/> Farmer:</span>
                  <input
                    type="text"
                    value={simPhone}
                    onChange={(e) => setSimPhone(e.target.value)}
                    className="bg-transparent text-white font-mono text-sm w-32 focus:outline-none border-b border-white/20 focus:border-[#54de99] transition-colors"
                  />
                </div>
              </div>

              {/* Language Selector */}
              <div className="bg-white px-5 py-3 flex items-center gap-4 overflow-x-auto shadow-sm z-10 border-b border-[#e5e7eb]">
                <span className="text-sm font-extrabold uppercase tracking-wider text-[#0f4d32] whitespace-nowrap flex items-center gap-2">
                  <Globe className="w-4 h-4" /> Language:
                </span>
                <div className="flex items-center gap-2">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => handleLanguageSwitch(lang)}
                      className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                        activeLang === lang.code
                          ? "bg-gradient-to-r from-[#0f4d32] to-[#125c3c] text-white shadow-md scale-105"
                          : "bg-[#f3f4f6] hover:bg-[#e8f7f0] text-[#4b5563] hover:text-[#0f4d32]"
                      }`}
                    >
                      {lang.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat Window */}
              <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6 bg-[#f0f2f5] inner-shadow">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.direction === "inbound" ? "items-end" : "items-start"
                    } animate-in fade-in slide-in-from-bottom-2`}
                  >
                    <div
                      className={`max-w-[85%] md:max-w-[80%] rounded-2xl p-4 text-[15px] shadow-sm transition-all duration-300 relative ${
                        msg.direction === "inbound"
                          ? "bg-gradient-to-br from-[#0f4d32] to-[#125c3c] text-white rounded-br-sm shadow-md"
                          : "bg-white text-[#1a1c1e] rounded-bl-sm border border-[#e5e7eb]"
                      }`}
                    >
                      {/* Media Upload */}
                      {msg.media_url && (
                         <div className="mb-4 rounded-xl overflow-hidden border border-white/20 bg-black/5">
                         <img
                           src={msg.media_url}
                           alt="Crop"
                           className="w-full h-48 md:h-56 object-cover hover:scale-110 transition-transform duration-500"
                         />
                         <div className="bg-[#1a1c1e] px-4 py-2 text-xs text-white font-mono flex items-center justify-between">
                           <span className="flex items-center gap-2"><Camera className="w-4 h-4 text-[#54de99]" /> Photo Uploaded</span>
                           <span className="text-[#54de99] font-bold tracking-wider">Vision Analysis</span>
                         </div>
                       </div>
                      )}

                      <p className="whitespace-pre-wrap leading-relaxed">
                        {msg.body}
                      </p>

                      {/* Diagnosis Card */}
                      {msg.action_type === "photo_diagnosis" && msg.diagnosis && (
                        <div className="mt-4 bg-[#f8fafc] rounded-xl p-4 border border-[#e2e8f0] border-l-4 border-l-[#0f4d32] shadow-sm">
                          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                            <span className="text-sm font-extrabold text-[#00351f] flex items-center gap-2">
                              <Activity className="w-4 h-4 text-[#0f4d32]" /> Analysis Result
                            </span>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm ${
                              msg.diagnosis.severity === "high"
                                ? "bg-red-100 text-red-700 border border-red-200"
                                : msg.diagnosis.severity === "medium"
                                ? "bg-orange-100 text-orange-700 border border-orange-200"
                                : "bg-green-100 text-green-700 border border-green-200"
                            }`}>
                              Severity: {msg.diagnosis.severity}
                            </span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-[#f1f5f9]">
                              <span className="text-[#64748b] font-semibold">Detected Issue:</span> 
                              <span className="font-bold text-[#0f4d32]">{msg.diagnosis.disease_name}</span>
                            </div>
                            <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-[#f1f5f9]">
                              <span className="text-[#64748b] font-semibold">Confidence:</span> 
                              <span className="font-mono text-[#00351f] font-bold bg-[#e8f7f0] px-2 py-0.5 rounded">
                                {((msg.diagnosis.confidence || 0.9) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className={`text-[11px] mt-2 flex items-center justify-end gap-1.5 ${
                        msg.direction === "inbound" ? "text-emerald-100" : "text-[#64748b]"
                      }`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {msg.direction === "inbound" ? (
                          <span className="flex items-center -space-x-1"><Check className="w-3.5 h-3.5 text-emerald-300" /><Check className="w-3.5 h-3.5 text-emerald-300" /></span>
                        ) : (
                          <Bot className="w-3.5 h-3.5" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex justify-start animate-in fade-in">
                    <div className="bg-white border border-[#e5e7eb] rounded-2xl px-5 py-3 text-sm text-[#4b5563] flex items-center gap-3 shadow-md font-medium">
                      <RefreshCw className="w-5 h-5 text-[#0f4d32] animate-spin" />
                      <span>AI is analyzing your request...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input Area */}
              <div className="bg-white border-t border-[#e5e7eb] p-5 flex flex-col gap-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] relative z-20">
                
                {/* Tools & Quick Actions */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#64748b] uppercase tracking-widest flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#0f4d32]" /> Actions & Samples
                    </span>
                    <button
                      onClick={() => setShowMediaInput(!showMediaInput)}
                      className="text-xs font-bold text-[#0f4d32] hover:text-[#00351f] bg-[#f0f9f4] px-3 py-1.5 rounded-lg border border-[#0f4d32]/20 transition-colors flex items-center gap-1.5"
                    >
                      {showMediaInput ? <><X className="w-3.5 h-3.5"/> Close Custom Image</> : <><Plus className="w-3.5 h-3.5"/> Custom Image URL</>}
                    </button>
                  </div>

                  {showMediaInput && (
                    <div className="flex gap-2 bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0]">
                      <input
                        type="text"
                        value={customMediaUrl}
                        onChange={(e) => setCustomMediaUrl(e.target.value)}
                        placeholder="Paste image URL..."
                        className="flex-1 bg-white border border-[#cbd5e1] rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#54de99] outline-none"
                      />
                      <Button
                        onClick={() => sendSimulationMessage("Diagnose this image", customMediaUrl, activeLang)}
                        disabled={!customMediaUrl.trim() || sending}
                        className="bg-[#0f4d32] hover:bg-[#00351f] text-white text-sm font-bold rounded-lg shadow-md"
                      >
                        Upload
                      </Button>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2">
                    {SAMPLE_DISEASE_PHOTOS.map((photo, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendSimulationMessage(photo.queries[activeLang] || photo.queries["en"], photo.url, activeLang)}
                        disabled={sending}
                        className="px-3 py-2 bg-white border border-[#e2e8f0] hover:border-[#0f4d32] hover:bg-[#f0f9f4] text-[#334155] rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center gap-2"
                      >
                        {photo.icon}
                        <span className="truncate max-w-[150px]">{photo.label}</span>
                      </button>
                    ))}
                    {QUICK_QUESTIONS.map((q, idx) => (
                      <button
                        key={`q-${idx}`}
                        onClick={() => sendSimulationMessage(q.queries[activeLang] || q.queries["en"], "", activeLang)}
                        disabled={sending}
                        className="px-3 py-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#334155] hover:text-[#0f4d32] rounded-xl text-xs font-medium transition-all"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Input */}
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendSimulationMessage(inputText, "", activeLang)}
                    placeholder="Type your question..."
                    className="flex-1 bg-[#f8fafc] border border-[#cbd5e1] rounded-2xl px-5 py-3.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-[#0f4d32]/50 shadow-inner font-medium placeholder:text-[#94a3b8]"
                  />
                  <Button
                    onClick={() => sendSimulationMessage(inputText, "", activeLang)}
                    disabled={sending || (!inputText.trim() && !customMediaUrl.trim())}
                    className="bg-gradient-to-r from-[#0f4d32] to-[#125c3c] hover:from-[#00351f] hover:to-[#0f4d32] text-white font-bold rounded-2xl px-8 h-auto shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-2"
                  >
                    <span>Send</span>
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>

            {/* Developer Setup */}
            <Card className="bg-white shadow-sm rounded-3xl border border-[#e5e7eb]">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2.5">
                  <Settings className="w-4 h-4 text-[#64748b]" />
                  <CardTitle className="text-xs font-bold text-[#334155] uppercase tracking-wider">Twilio Webhook Setup</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-[#f8fafc] p-3 rounded-xl border border-[#e2e8f0] font-mono text-[10px] md:text-[11px] text-[#4b5563] space-y-1.5">
                  <p className="font-bold text-[#64748b]">Endpoint URL:</p>
                  <div className="bg-white p-2 rounded-lg border border-[#cbd5e1] text-[#0f4d32] font-bold break-all">
                    {resolvedBase}/webhooks/whatsapp-inbound
                  </div>
                  <p className="pt-1"><span className="font-bold text-[#64748b]">ngrok cmd:</span> <code className="bg-[#e2e8f0] px-1 rounded text-[#1a1c1e]">ngrok http 8000</code></p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Connection & Guides */}
          <div className="flex flex-col gap-6">
            
            {/* Real WhatsApp Connect */}
            <Card className="bg-white border border-[#e5e7eb] shadow-md rounded-3xl overflow-hidden transition-all relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#f0f9f4] rounded-full blur-2xl"></div>
              <CardHeader className="pb-3 relative z-10 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#e8f7f0] text-[#25D366] flex items-center justify-center border border-[#25D366]/20 shrink-0">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[#0f4d32] font-extrabold text-[10px] uppercase tracking-wider mb-0.5 inline-block">
                      Mobile Experience
                    </span>
                    <CardTitle className="text-lg font-extrabold text-[#1a1c1e]">Try on Real WhatsApp</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 relative z-10">
                <div className="bg-[#f8fafc] rounded-2xl p-4 border border-[#e2e8f0] text-center">
                  <p className="text-xs font-semibold text-[#64748b] mb-1.5 uppercase tracking-wider">Twilio Sandbox Number</p>
                  <p className="font-mono text-lg font-black text-[#0f4d32] tracking-widest bg-white py-2 rounded-lg border border-[#cbd5e1]">
                    +1 415 523 8886
                  </p>
                  
                  <div className="mt-5 space-y-3">
                    <a
                      href="https://wa.me/14155238886?text=join%20watch-ate"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-extrabold text-sm rounded-xl shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all block text-center"
                    >
                      <span className="flex items-center justify-center gap-2">1. Connect via Join Code <ExternalLink className="w-4 h-4" /></span>
                    </a>
                    <a
                      href="https://wa.me/14155238886?text=Namaste!%20I%20want%20to%20ask%20a%20question%20about%20my%20crops"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 bg-white border-2 border-[#0f4d32] text-[#0f4d32] hover:bg-[#0f4d32] hover:text-white font-extrabold text-sm rounded-xl shadow-sm hover:shadow-md flex items-center justify-center gap-2 transition-all block text-center"
                    >
                      <span className="flex items-center justify-center gap-2">2. Start Asking Questions <MessageSquare className="w-4 h-4" /></span>
                    </a>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#f0f9f4] p-4 rounded-2xl border border-[#0f4d32]/10 flex flex-col gap-2">
                    <Camera className="w-5 h-5 text-[#0f4d32]"/>
                    <span className="text-xs font-bold text-[#00351f]">Send Leaf Photos</span>
                    <span className="text-[10px] text-[#4b5563]">Instant AI disease diagnosis & severity check.</span>
                  </div>
                  <div className="bg-[#f0f9f4] p-4 rounded-2xl border border-[#0f4d32]/10 flex flex-col gap-2">
                    <Globe className="w-5 h-5 text-[#0f4d32]"/>
                    <span className="text-xs font-bold text-[#00351f]">Multi-lingual</span>
                    <span className="text-[10px] text-[#4b5563]">Reply in Hindi, Telugu, Marathi, Tamil, or English.</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Voice IVR Hotline */}
            <Card className="bg-gradient-to-br from-white to-[#f0f9f4] border border-[#e5e7eb] shadow-md rounded-3xl overflow-hidden relative">
              <CardHeader className="pb-3 border-b border-[#f1f5f9]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#e8f7f0] flex items-center justify-center border border-[#c0c9c0]/50">
                    <PhoneCall className="w-5 h-5 text-[#0f4d32]" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-extrabold text-[#1a1c1e]">Indic Voice IVR</CardTitle>
                    <CardDescription className="text-[#64748b] text-xs font-medium">Bhashini AI Text-to-Speech</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="bg-white border border-[#cbd5e1] rounded-2xl p-4 text-center shadow-sm">
                  <p className="text-xs text-[#64748b] font-bold uppercase tracking-widest mb-1">Toll-Free Hotline</p>
                  <p className="text-xl md:text-2xl font-black tracking-wider text-[#0f4d32]">
                    1800-AGRI-SHIELD
                  </p>
                </div>
                
                <div className="space-y-3 bg-white p-4 rounded-2xl border border-[#cbd5e1] text-sm shadow-sm">
                  <p className="font-bold text-[#1a1c1e] border-b border-[#f1f5f9] pb-2">Dial-pad Flow:</p>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-3"><span className="w-5 h-5 rounded bg-[#f1f5f9] border border-[#e2e8f0] font-bold flex items-center justify-center text-xs text-[#334155]">1</span> <span className="font-medium text-[#475569] text-xs">Crop Recommendations</span></li>
                    <li className="flex items-center gap-3"><span className="w-5 h-5 rounded bg-[#f1f5f9] border border-[#e2e8f0] font-bold flex items-center justify-center text-xs text-[#334155]">2</span> <span className="font-medium text-[#475569] text-xs">Weather & Dry-Spell Alerts</span></li>
                    <li className="flex items-center gap-3"><span className="w-5 h-5 rounded bg-[#f1f5f9] border border-[#e2e8f0] font-bold flex items-center justify-center text-xs text-[#334155]">3</span> <span className="font-medium text-[#475569] text-xs">Report Disease & Claim</span></li>
                    <li className="flex items-center gap-3"><span className="w-5 h-5 rounded bg-[#e8f7f0] border border-[#54de99]/50 text-[#0f4d32] font-bold flex items-center justify-center text-xs">0</span> <span className="font-bold text-[#0f4d32] text-xs">Talk to Expert</span></li>
                  </ul>
                </div>
              </CardContent>
            </Card>

          </div>

        </div>
      </div>
    </div>
  );
}
