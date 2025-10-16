"use client";

import React, { useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ClipboardList, Paperclip, Mic, MicOff, Send, LayoutGrid, Droplet, ArrowUpDown, Pencil } from "lucide-react";
import { Resume, ResumeSchema } from "@/lib/resume/schema";

// Types
type OutputFormat = "plain" | "markdown" | "html";
type ContentKind = "candidate_intro" | "bd_email" | "linkedin_post" | "proposal_blurb";

const TEMPLATE_SUGGESTIONS: Record<ContentKind, string> = {
  candidate_intro:
    "Create a concise, compelling candidate introduction for a hiring manager. Tone: professional, confident. Include 3–5 bullet achievements with metrics and a one-line value proposition. Keep under 140 words.",
  bd_email:
    "Write a short business development email to a prospective client. Tone: consultative, value-first, no fluff. Include a personalized opener, 2 bullets of outcomes we deliver, and a crisp CTA for a 15-minute call. 90–120 words.",
  linkedin_post:
    "Draft a LinkedIn post announcing an exceptional candidate or a recent client success. Tone: positive, insights-driven, no hype. Include 3 scannable lines, 2 bullets of impact, and a soft CTA. 80–120 words.",
  proposal_blurb:
    "Create a proposal summary paragraph describing our approach, differentiation, and expected outcomes. Tone: credible, specific, measurable. 80–120 words.",
};

// Small helpers
function htmlEscape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export default function ContentGeneratorPage() {
  // Basic states
  const [kind] = useState<ContentKind>("candidate_intro");
  const DEFAULT_BRAND_VOICE = "Modern, trustworthy, outcome-focused";
  const DEFAULT_AUDIENCE = "Hiring manager / Decision maker";
  const DEFAULT_FORMAT: OutputFormat = "plain";
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");

  // Resume states
  const [resume, setResume] = useState<Resume | null>(null);
  const [resumePreview, setResumePreview] = useState<string>("");

  // UI flow
  const [step, setStep] = useState<"upload" | "decide" | "editor">("upload");
  const [isDragging, setIsDragging] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [improving, setImproving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Design controls (subset)
  const [templateId, setTemplateId] = useState<"onebit" | "classic" | "contemporary">("onebit");
  const [fontFamily, setFontFamily] = useState<string>("ui-sans-serif, system-ui, Segoe UI, Roboto, Helvetica, Arial");
  const [brandColor, setBrandColor] = useState<string>("#0ea5e9");
  const [brandOn, setBrandOn] = useState<boolean>(true);
  const [pageMargin, setPageMargin] = useState<number>(3); // 1..5
  const [fontScale, setFontScale] = useState<number>(2); // 1..5

  const suggestedPrompt = useMemo(() => TEMPLATE_SUGGESTIONS[kind], [kind]);

  const composePrompt = () => {
    return [
      "Task: " + suggestedPrompt,
      "Brand voice: " + DEFAULT_BRAND_VOICE,
      "Audience: " + DEFAULT_AUDIENCE,
      inputText ? "Additional inputs:\n" + inputText : "",
      "Output format: " + DEFAULT_FORMAT.toUpperCase(),
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const handleGenerate = async () => {
    try {
      const prompt = composePrompt();
      const res = await fetch("/api/ai/generate-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const json = await res.json().catch(() => ({}));
      const text = json?.text || json?.message || "Draft generated. Refine with more details or try another template.";
      setResult(text);
    } catch {
      setResult("Generation failed. Please try again with more specific inputs.");
    }
  };

  // File handling and parsing
  const handleFile = async (file?: File | null) => {
    if (!file) return;
    try {
      const form = new FormData();
      form.append("file", file);
      const textRes = await fetch("/api/files/extract-text", { method: "POST", body: form });
      const textJson = await textRes.json();
      if (textRes.ok && textJson?.text) {
        const parseRes = await fetch("/api/resume/parse", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textJson.text }),
        });
        const parseJson = await parseRes.json();
        const parsed = parseJson?.resume || parseJson?.data;
        if (parseJson?.success && parsed) {
          const valid = ResumeSchema.parse(parsed);
          setResume(valid);
          setResumePreview(renderResumeHtml(valid));
          setStep("decide");
          return;
        }
      }
      // fallback shell
      const shell: Resume = { basics: { name: "", title: "" }, skills: [], experience: [] } as any;
      setResume(shell);
      setResumePreview(renderResumeHtml(shell));
      setStep("decide");
    } catch {
      const shell: Resume = { basics: { name: "", title: "" }, skills: [], experience: [] } as any;
      setResume(shell);
      setResumePreview(renderResumeHtml(shell));
      setStep("decide");
    }
  };

  const handleParseFromText = async () => {
    if (!inputText.trim()) return;
    const parseRes = await fetch("/api/resume/parse", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: inputText }),
    });
    const parseJson = await parseRes.json();
    const parsed = parseJson?.resume || parseJson?.data;
    if (parseJson?.success && parsed) {
      const valid = ResumeSchema.parse(parsed);
      setResume(valid);
      setResumePreview(renderResumeHtml(valid));
      setStep("decide");
    }
  };

  // Dictation via Web Speech API
  const recognitionRef = React.useRef<any>(null);
  const startDictation = () => {
    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) return;
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";
      rec.onresult = (e: any) => {
        let text = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          text += e.results[i][0].transcript;
        }
        setInputText((prev) => (prev ? prev + " " : "") + text);
      };
      rec.onend = () => setIsDictating(false);
      recognitionRef.current = rec;
      rec.start();
      setIsDictating(true);
    } catch {}
  };
  const stopDictation = () => {
    try {
      recognitionRef.current?.stop();
    } catch {}
    setIsDictating(false);
  };

  // Renderers: avoid nested backticks by building strings with concatenation
  const renderTemplateClassic = (r: Resume): string => {
    const exps = r.experience || [];
    const skills = r.skills || [];
    const edus = (r as any).education || [];
    const space = 10 + (2) * 4; // keep simple spacing

    let html = "";
    html += "<style>:root{ --brand:" + (brandOn ? brandColor : "#111827") + "; } body{ font-family:" + fontFamily + "; } h1,h2{ color:var(--brand); } .muted{ color:#4b5563 } .sec{ margin-top:" + space + "px }</style>";
    html += "<div>";
    html += '<h1 style="font-size:28px;font-weight:700;">' + (r.basics?.name || "") + "</h1>";
    if (r.basics?.title) html += '<div class="muted" style="margin-top:2px;">' + htmlEscape(r.basics.title) + "</div>";
    if (r.basics?.summary) html += '<p style="margin-top:8px;">' + htmlEscape(r.basics.summary) + "</p>";
    if (exps.length) html += '<h2 class="sec" style="font-size:18px;font-weight:600;">Experience</h2>';
    exps.forEach((e: any) => {
      const bullets = (e.bullets || []).map((b: string) => "<li>" + htmlEscape(b) + "</li>").join("");
      html += '<div style="margin-top:8px;">' +
        '<div style="font-weight:600;">' + htmlEscape(e.role || "") + " • " + htmlEscape(e.company || "") + "</div>" +
        '<div class="muted" style="font-size:12px;">' + htmlEscape(e.period || "") + "</div>" +
        (bullets ? '<ul style="margin-left:18px;">' + bullets + "</ul>" : "") +
      "</div>";
    });
    if (skills.length) html += '<h2 class="sec" style="font-size:18px;font-weight:600;">Skills</h2>';
    skills.forEach((s: any) => {
      html += '<div style="margin-top:4px;"><span style="font-weight:600;">' + htmlEscape(s.category || "") + ':</span> ' + (s.items || []).map((x: string) => htmlEscape(x)).join(", ") + "</div>";
    });
    if (edus.length) html += '<h2 class="sec" style="font-size:18px;font-weight:600;">Education</h2>';
    edus.forEach((ed: any) => {
      html += '<div style="margin-top:6px;">' +
        '<div style="font-weight:600;">' + htmlEscape(ed.school || "") + (ed.degree ? ' — ' + htmlEscape(ed.degree) : "") + "</div>" +
        '<div class="muted" style="font-size:12px;">' + htmlEscape(ed.period || "") + "</div>" +
      "</div>";
    });
    html += "</div>";
    return html;
  };

  const renderTemplateContemporary = (r: Resume): string => {
    const exps = r.experience || [];
    const skills = r.skills || [];
    const edus = (r as any).education || [];
    const space = 8 + (2) * 4;

    let html = "";
    html += ":root{ --brand:" + (brandOn ? brandColor : "#111827") + " } body{font-family:" + fontFamily + "} .left{width:30%;padding-right:16px;border-right:2px solid var(--brand)} .right{width:70%;padding-left:16px} h1{color:var(--brand);margin:0} h2{color:var(--brand);margin:" + space + "px 0 8px 0}";
    html = "<style>" + html + "</style>";
    html += '<div style="display:flex;gap:16px;">';
    html += '<div class="left">';
    html += '<h1 style="font-size:24px;font-weight:700;">' + htmlEscape(r.basics?.name || "") + "</h1>";
    if (r.basics?.title) html += '<div class="muted">' + htmlEscape(r.basics.title) + "</div>";
    if (skills.length) html += '<h2 style="font-size:16px;font-weight:600;">Skills</h2>';
    skills.forEach((s: any) => {
      html += '<div style="margin:4px 0;"><span style="font-weight:600;">' + htmlEscape(s.category || "") + ':</span> ' + (s.items || []).map((x: string) => htmlEscape(x)).join(", ") + "</div>";
    });
    html += "</div>";
    html += '<div class="right">';
    if (r.basics?.summary) html += '<p>' + htmlEscape(r.basics.summary) + "</p>";
    if (exps.length) html += '<h2 style="font-size:16px;font-weight:600;">Experience</h2>';
    exps.forEach((e: any) => {
      const bullets = (e.bullets || []).map((b: string) => "<li>" + htmlEscape(b) + "</li>").join("");
      html += '<div style="margin-top:6px;">' +
        '<div style="font-weight:600;">' + htmlEscape(e.role || "") + " • " + htmlEscape(e.company || "") + "</div>" +
        '<div class="muted" style="font-size:12px;">' + htmlEscape(e.period || "") + "</div>" +
        (bullets ? '<ul style="margin-left:18px;">' + bullets + "</ul>" : "") +
      "</div>";
    });
    if (edus.length) html += '<h2 style="font-size:16px;font-weight:600;">Education</h2>';
    edus.forEach((ed: any) => {
      html += '<div style="margin-top:6px;">' +
        '<div style="font-weight:600;">' + htmlEscape(ed.school || "") + (ed.degree ? ' — ' + htmlEscape(ed.degree) : "") + "</div>" +
        '<div class="muted" style="font-size:12px;">' + htmlEscape(ed.period || "") + "</div>" +
      "</div>";
    });
    html += "</div></div>";
    return html;
  };

  const renderTemplateOneBit = (r: Resume): string => {
    const exps = r.experience || [];
    const skills = r.skills || [];
    const rule = 14 + (2) * 4;

    let css = "";
    css += "body{font-family:" + fontFamily + ";}";
    css += ".rule{border-top:1.8px solid #0f172a;margin:" + rule + "px 0}";
    css += ".name{font-weight:800;font-size:30px;letter-spacing:.4px}";
    css += ".title{font-size:14px;margin-top:2px;color:#0f172a}";
    css += ".section{font-weight:800;margin-top:8px}";
    css += ".meta{font-size:12px;color:#0f172a}";

    let html = "<style>" + css + "</style>";
    html += '<div style="padding:4px 2px;">';
    html += '<div class="name" style="text-align:center;">' + htmlEscape(r.basics?.name || "") + "</div>";
    if (r.basics?.title) html += '<div class="title" style="text-align:center;">' + htmlEscape(r.basics.title) + "</div>";
    if (r.basics?.summary) html += '<div class="rule"></div><p style="line-height:1.35;">' + htmlEscape(r.basics.summary) + "</p>";
    if (exps.length || skills.length) html += '<div class="rule"></div>';
    if (exps.length) html += '<h2 class="section">Experience</h2>';
    exps.forEach((e: any) => {
      const bullets = (e.bullets || []).map((b: string) => "<li>" + htmlEscape(b) + "</li>").join("");
      html += '<div style="margin-top:6px;">' +
        '<div style="display:flex;justify-content:space-between;"><div style="font-weight:700;">' + htmlEscape(e.role || "") + " — " + htmlEscape(e.company || "") + '</div><div class="meta">' + htmlEscape(e.period || "") + "</div></div>" +
        (bullets ? '<ul style="margin-left:18px;line-height:1.3;">' + bullets + "</ul>" : "") +
      "</div>";
    });
    if (skills.length) {
      html += '<div class="rule"></div><h2 class="section">Skills</h2>' +
        skills.map((s: any) => '<div><b>' + htmlEscape(s.category || "") + ':</b> ' + (s.items || []).map((x: string) => htmlEscape(x)).join(", ") + "</div>").join("");
    }
    html += "</div>";
    return html;
  };

  const renderResumeHtml = (r: Resume) => {
    if (templateId === "onebit") return renderTemplateOneBit(r);
    return templateId === "classic" ? renderTemplateClassic(r) : renderTemplateContemporary(r);
  };

  // Basic editor helpers
  const updateBasics = (field: keyof Resume["basics"], value: string) => {
    if (!resume) return;
    const next = { ...resume, basics: { ...resume.basics, [field]: value } } as Resume;
    setResume(next);
    setResumePreview(renderResumeHtml(next));
  };

  const addExperience = () => {
    if (!resume) return;
    const id = (globalThis.crypto || (window as any).crypto).randomUUID();
    const next = { ...resume, experience: [...(resume.experience || []), { id, role: "", company: "", period: "", bullets: [] }] } as any;
    setResume(next);
    setResumePreview(renderResumeHtml(next));
  };

  const updateExperienceField = (id: string, field: "role" | "company" | "period", value: string) => {
    if (!resume) return;
    const next = { ...resume } as any;
    next.experience = (next.experience || []).map((e: any) => (e.id === id ? { ...e, [field]: value } : e));
    setResume(next);
    setResumePreview(renderResumeHtml(next));
  };

  const addBullet = (id: string) => {
    if (!resume) return;
    const next = { ...resume } as any;
    next.experience = (next.experience || []).map((e: any) => (e.id === id ? { ...e, bullets: [...(e.bullets || []), ""] } : e));
    setResume(next);
  };

  const updateBullet = (id: string, idx: number, text: string) => {
    if (!resume) return;
    const next = { ...resume } as any;
    next.experience = (next.experience || []).map((e: any) => {
      if (e.id !== id) return e;
      const bullets = [...(e.bullets || [])];
      bullets[idx] = text;
      return { ...e, bullets };
    });
    setResume(next);
  };

  // Improve with AI
  const [jobText, setJobText] = useState("");
  const handleImprove = async () => {
    if (!resume) {
      setStep("editor");
      return;
    }
    try {
      setImproving(true);
      const res = await fetch("/api/resume/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, job: jobText }),
      });
      const js = await res.json();
      if (js?.success && js.resume) {
        const valid = ResumeSchema.parse(js.resume);
        setResume(valid);
        setResumePreview(renderResumeHtml(valid));
      }
    } catch {}
    setImproving(false);
    setStep("editor");
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <ClipboardList className="h-6 w-6 text-primary-600 mr-2" />
              Content Generator
            </h1>
            <p className="text-gray-600 mt-1">Generate compelling candidate introductions and business development materials</p>
          </div>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-4 mb-4 text-sm">
          <div className={"px-2 py-1 rounded " + (step === "upload" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700")}>1. Upload</div>
          <div className={"px-2 py-1 rounded " + (step === "decide" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700")}>2. Choose</div>
          <div className={"px-2 py-1 rounded " + (step === "editor" ? "bg-primary-100 text-primary-700" : "bg-gray-100 text-gray-700")}>3. Edit</div>
        </div>

        {/* Upload step */}
        {step === "upload" && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardContent className="p-10">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Add your content to get started</h2>
                <p className="text-gray-600">Drag & drop a PDF/DOCX/TXT, paste or type below, or use dictation.</p>
              </div>

              <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFile(f);
                  }}
                  className={(isDragging ? "border-primary-300 bg-primary-50 " : "border-dashed border-gray-300 ") + "rounded-xl border-2 p-6"}
                >
                  <Textarea
                    className="border-none focus:ring-0 min-h-[180px]"
                    placeholder="Paste or type here… or drag & drop a PDF/DOCX/TXT"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                <div className="flex items-center justify-center gap-3 mt-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files?.[0] || null)}
                    />
                    <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                      <Paperclip className="h-4 w-4 mr-1" />
                      Upload File
                    </Button>
                  {!isDictating ? (
                      <Button variant="outline" onClick={startDictation}>
                        <Mic className="h-4 w-4 mr-1" />
                        Dictate
                      </Button>
                  ) : (
                      <Button variant="outline" onClick={stopDictation}>
                        <MicOff className="h-4 w-4 mr-1" />
                        Stop
                      </Button>
                  )}
                    <Button className="bg-primary-600 text-white" onClick={handleParseFromText}>
                      <Send className="h-4 w-4 mr-1" />
                      Continue
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {/* Decide step */}
        {step === "decide" && (
          <div className="grid grid-cols-1 gap-6">
            <Card>
              <CardContent className="p-10 space-y-6">
                {improving && (
                  <div className="fixed inset-0 bg-white/90 backdrop-blur-sm z-40 flex flex-col items-center justify-center text-center p-6">
                    <div className="text-lg font-semibold text-gray-900">Polishing your resume with AI…</div>
                    <div className="text-gray-600 mt-1">Aligning keywords and improving clarity.</div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-4">
                  <Button variant="outline" onClick={() => setStep("editor")}>
                    Work with original text
                  </Button>
                  <Button className="bg-primary-600 text-white" onClick={handleImprove}>
                    Improve with AI
                  </Button>
                </div>
                <div className="max-w-3xl mx-auto w-full">
                  <label className="text-xs text-gray-600">Job description (optional)</label>
                  <Textarea rows={5} placeholder="Paste the job to tailor the resume…" value={jobText} onChange={(e) => setJobText(e.target.value)} />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Editor step */}
        {step === "editor" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left Sidebar */}
            <div className="lg:col-span-2 space-y-2">
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Pencil className="h-4 w-4 text-primary-600 mr-2" />
                  Add section
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <ArrowUpDown className="h-4 w-4 text-primary-600 mr-2" />
                  Rearrange
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Droplet className="h-4 w-4 text-primary-600 mr-2" />
                  Design & Font
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setTemplateId(templateId === "onebit" ? "classic" : templateId === "classic" ? "contemporary" : "onebit") }>
                  <LayoutGrid className="h-4 w-4 text-primary-600 mr-2" />
                  Template: {templateId}
                </Button>
              </div>
            </div>

            {/* Center Canvas */}
            <div className="lg:col-span-10">
              <Card>
                <CardContent className="p-6 space-y-4">
                  {resume && (
                    <div
                      className="relative max-w-5xl mx-auto bg-white border shadow-sm p-10"
                      style={{ padding: `${pageMargin * 6}px`, fontSize: `${12 + (fontScale - 2) * 1.5}px` }}
                    >
                      <div className="absolute right-4 top-4">
                        <Button variant="outline" size="sm" onClick={() => setFontScale((s) => Math.min(5, s + 1))}>A+</Button>
                      </div>
                      <div dangerouslySetInnerHTML={{ __html: renderResumeHtml(resume) }} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick edit basics */}
            <div className="lg:col-span-12">
              <Card>
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Input placeholder="Name" value={resume?.basics?.name || ""} onChange={(e) => updateBasics("name", e.target.value)} />
                  <Input placeholder="Title" value={resume?.basics?.title || ""} onChange={(e) => updateBasics("title", e.target.value)} />
                  <Input placeholder="Summary" value={resume?.basics?.summary || ""} onChange={(e) => updateBasics("summary" as any, e.target.value)} />
                </CardContent>
              </Card>
                    </div>

            {/* Experience editor */}
            <div className="lg:col-span-12">
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Experience</div>
                    <Button variant="outline" size="sm" onClick={addExperience}>+ Entry</Button>
                      </div>
                  {(resume?.experience || []).map((e: any) => (
                          <div key={e.id} className="border rounded p-3 space-y-2">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Input placeholder="Role" value={e.role} onChange={(ev) => updateExperienceField(e.id, "role", ev.target.value)} />
                        <Input placeholder="Company" value={e.company} onChange={(ev) => updateExperienceField(e.id, "company", ev.target.value)} />
                        <Input placeholder="Period" value={e.period} onChange={(ev) => updateExperienceField(e.id, "period", ev.target.value)} />
                            </div>
                            <div className="space-y-1">
                        {(e.bullets || []).map((b: string, bi: number) => (
                          <Input key={bi} className="w-full" value={b} onChange={(ev) => updateBullet(e.id, bi, ev.target.value)} />
                        ))}
                        <Button variant="outline" size="sm" onClick={() => addBullet(e.id)}>Add bullet</Button>
                            </div>
                          </div>
                        ))}
                </CardContent>
              </Card>
                </div>
          </div>
        )}
      </div>
    </Layout>
  );
}


