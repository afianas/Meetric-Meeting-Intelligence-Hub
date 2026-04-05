"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  Trash2,
  X,
  Play,
  RefreshCcw,
  ArrowRight,
  CloudUpload,
  Info,
  Zap,
  TrendingUp
} from "lucide-react"
import { uploadTranscript, getMeetings, deleteMeeting, BackendMeeting, normalizeMeeting, getInitials } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

type UploadStatus = "idle" | "uploading" | "processing" | "completed" | "error"

interface UploadItem {
  id: string;
  file: File;
  meetingName: string;
  status: UploadStatus;
  progress: number;
  error?: string;
  resultId?: string;
}

export default function UploadPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [uploadQueue, setUploadQueue] = useState<UploadItem[]>([])
  const [isBatchProcessing, setIsBatchProcessing] = useState(false)
  const [globalError, setGlobalError] = useState<string | null>(null)

  // Emotion styling helper - Synchronized with EMOTION_COLORS from semantics/page.tsx
  const emotionBadgeStyle = (emotion: string) => {
    const EMOTION_COLORS: Record<string, string> = {
      agreement: "#15803d",
      conflict: "#b91c1c",
      concern: "#d97706",
      uncertainty: "#7c3aed",
      neutral: "#64748b"
    }
    const e = (emotion || "neutral").toLowerCase();
    const color = EMOTION_COLORS[e] || EMOTION_COLORS.neutral;
    return {
      backgroundColor: `${color}15`,
      color: color,
    }
  }

  const { data: meetings = [], isLoading: loadingMeetings } = useQuery({
    queryKey: ['meetings'],
    queryFn: getMeetings,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    }
  })

  // Helper for title casing
  const titleCase = (str: string) => {
    return str.toLowerCase().split(' ').map(word => {
      return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
  };

  // Batch Selection Handler
  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;

    setGlobalError(null);
    const newItems: UploadItem[] = [];
    const allowedExts = [".txt", ".vtt"];

    Array.from(files).forEach(file => {
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();

      // Validation: Type
      if (!allowedExts.includes(ext)) {
        setGlobalError(`Skipped "${file.name}": Only .txt and .vtt files supported.`);
        return;
      }

      // Validation: Size
      if (file.size === 0) {
        setGlobalError(`Skipped "${file.name}": File is empty.`);
        return;
      }

      // Validation: Duplicate in queue
      const isDuplicate = uploadQueue.some(item => item.file.name === file.name && item.file.size === file.size);
      if (isDuplicate) {
        setGlobalError(`"${file.name}" is already in the queue.`);
        return;
      }

      newItems.push({
        id: Math.random().toString(36).substring(7),
        file,
        meetingName: titleCase(file.name.split('.')[0].replace(/_/g, ' ').replace(/-/g, ' ')),
        status: "idle",
        progress: 0
      });
    });

    setUploadQueue(prev => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Individual Queue Actions
  const updateItem = (id: string, updates: Partial<UploadItem>) => {
    setUploadQueue(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeItem = (id: string) => {
    setUploadQueue(prev => prev.filter(item => item.id !== id));
  };

  const retryItem = (id: string) => {
    updateItem(id, { status: "idle", error: undefined, progress: 0 });
  };

  // Sequential Batch Processor
  const processBatch = async () => {
    if (isBatchProcessing) return;
    setIsBatchProcessing(true);

    const idleItems = uploadQueue.filter(item => item.status === "idle" || item.status === "error");

    for (const item of idleItems) {
      try {
        updateItem(item.id, { status: "uploading", progress: 10 });
        const uploadProgressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map(queueItem =>
            queueItem.id === item.id && queueItem.progress < 30
              ? { ...queueItem, progress: queueItem.progress + 5 }
              : queueItem
          ));
        }, 100);

        await new Promise(resolve => setTimeout(resolve, 500));
        clearInterval(uploadProgressInterval);
        updateItem(item.id, { status: "processing", progress: 40 });

        const result = await uploadTranscript(item.file, item.meetingName);

        updateItem(item.id, {
          status: "completed",
          progress: 100,
          resultId: result._id
        });
        queryClient.invalidateQueries({ queryKey: ['meetings'] });
      } catch (err: any) {
        updateItem(item.id, {
          status: "error",
          error: err?.message || "Internal processing error"
        });
      }
    }

    setIsBatchProcessing(false);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const hasProcessableItems = uploadQueue.some(item => item.status === "idle" || item.status === "error");

  return (
    <div className="space-y-12 pb-10 animate-in fade-in duration-700">
      {/* Editorial Header - Aligned with Meetric Premium Aesthetic */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6 px-4">
        <h1 className="font-serif text-5xl tracking-tight text-foreground leading-tight">
          Synthesize Dialogue into <span className="text-primary italic">Knowledge</span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed font-light">
          Transform raw meeting transcripts into high-fidelity editorial intelligence.
          Meetric extracts decisions and intent with surgical precision.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 max-w-7xl mx-auto w-full px-4 sm:px-6">
        <div className="lg:col-span-8 space-y-10">

          {/* Drop zone - PREMIUM GLASSMORPHIC RE-DESIGN */}
          <div
            className={`relative group overflow-hidden rounded-[2.5rem] border border-border/40 bg-background/40 backdrop-blur-md transition-all duration-500 ease-out ${isDragging
                ? "border-primary/40 bg-primary/5 scale-[1.01] shadow-2xl shadow-primary/10"
                : "hover:border-primary/20 hover:bg-background/60 shadow-sm"
              }`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => {
              e.preventDefault();
              setIsDragging(false);
              handleFilesSelected(e.dataTransfer.files);
            }}
          >
            {/* Theme-aligned Mesh Gradient (Radial) */}
            <div className={`absolute inset-0 opacity-0 transition-opacity duration-700 pointer-events-none ${isDragging ? "opacity-20" : "group-hover:opacity-10"}`}>
              <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary blur-[120px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-primary blur-[120px] opacity-60" />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              multiple
              onChange={e => handleFilesSelected(e.target.files)}
              accept=".txt,.vtt"
            />

            <div className="flex flex-col items-center justify-center py-24 px-6 relative z-10 text-center">
              <div className={`flex h-24 w-24 items-center justify-center rounded-3xl rotate-[-4deg] transition-all duration-500 shadow-xl ${isDragging ? "bg-primary scale-110 rotate-0 shadow-primary/20" : "bg-muted/40 group-hover:bg-primary/10 group-hover:rotate-0"
                }`}>
                <CloudUpload className={`h-12 w-12 transition-colors duration-500 ${isDragging ? "text-primary-foreground" : "text-muted-foreground group-hover:text-primary"}`} />
              </div>

              <div className="mt-10 space-y-3 px-4">
                <h3 className="text-2xl font-bold text-foreground tracking-tight">Drop your transcripts</h3>
                <p className="text-sm text-muted-foreground font-light max-w-sm mx-auto leading-relaxed">
                  Support for multi-file <Badge variant="secondary" className="mx-1 font-mono text-[10px] bg-primary/5 text-primary border-none">.vtt</Badge> and
                  <Badge variant="secondary" className="mx-1 font-mono text-[10px] bg-primary/5 text-primary border-none">.txt</Badge> indexing.
                </p>
              </div>

              <Button
                variant="outline"
                className={`mt-12 h-12 px-10 rounded-2xl border-border/60 bg-background/50 backdrop-blur-sm font-bold uppercase tracking-widest text-[10px] transition-all duration-500 hover:shadow-xl hover:border-primary/40 active:scale-95 ${isBatchProcessing ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={() => fileInputRef.current?.click()}
                disabled={isBatchProcessing}
              >
                Browse Filesystem
              </Button>

              {globalError && (
                <div className="mt-8 flex items-center gap-3 text-[10px] font-bold uppercase tracking-widest text-destructive bg-destructive/10 backdrop-blur-sm px-5 py-3 rounded-2xl border border-destructive/20 animate-in fade-in slide-in-from-bottom-2 duration-500">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{globalError}</span>
                  <X className="h-3 w-3 ml-2 cursor-pointer opacity-50 hover:opacity-100" onClick={() => setGlobalError(null)} />
                </div>
              )}
            </div>
          </div>

          {/* Upload Queue - SYNCHRONIZED WITH SEMANTICS CARD STYLE */}
          {uploadQueue.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-center justify-between mb-6 px-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Staging Queue</h3>
                  <Badge variant="outline" className="text-[10px] font-bold text-primary/60 border-primary/20 px-2">{uploadQueue.length}</Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-[10px] uppercase tracking-[0.2em] font-black h-8 text-muted-foreground/40 hover:text-destructive transition-colors px-4 rounded-xl"
                    onClick={() => setUploadQueue([])}
                    disabled={isBatchProcessing}
                  >
                    Discard All
                  </Button>
                  <Button
                    size="sm"
                    className="text-[10px] uppercase tracking-[0.2em] font-black h-8 bg-primary hover:bg-primary/90 px-6 rounded-xl shadow-lg border-none"
                    disabled={!hasProcessableItems || isBatchProcessing}
                    onClick={processBatch}
                  >
                    {isBatchProcessing ? (
                      <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Indexing...</>
                    ) : (
                      <><Play className="h-2.5 w-2.5 mr-2" /> Begin Synthesis</>
                    )}
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                {uploadQueue.map((item) => (
                  <Card key={item.id} className="group border-border/40 bg-background/40 backdrop-blur-md rounded-3xl hover:border-primary/20 transition-all duration-500 overflow-hidden shadow-none">
                    <CardContent className="p-6 flex flex-col gap-5">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex items-start gap-5 flex-1 min-w-0">
                          <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 ${item.status === "completed" ? "bg-green-500/10 text-green-600" :
                              item.status === "error" ? "bg-destructive/10 text-destructive" :
                                "bg-primary/5 text-primary group-hover:bg-primary/10"
                            }`}>
                            {item.status === "completed" ? <CheckCircle2 className="h-7 w-7" /> :
                              item.status === "error" ? <AlertCircle className="h-7 w-7" /> :
                                item.status === "idle" ? <FileText className="h-7 w-7" /> :
                                  <Loader2 className="h-7 w-7 animate-spin" />}
                          </div>

                          <div className="flex-1 space-y-2 min-w-0">
                            <div className="flex items-center gap-3">
                              <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary/40">Meeting Title</span>
                              {item.status === "idle" && <Badge variant="secondary" className="text-[8px] h-4 px-2 font-bold uppercase tracking-widest bg-primary/5 text-primary/60 border-none">Auto-draft</Badge>}
                            </div>
                            <Input
                              value={item.meetingName}
                              onChange={(e) => updateItem(item.id, { meetingName: e.target.value })}
                              disabled={item.status !== "idle" && item.status !== "error"}
                              placeholder="Name this dialogue session..."
                              className="h-10 text-xl font-bold p-0 border-none bg-transparent hover:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/20 italic"
                            />
                            <div className="flex items-center gap-4">
                              <span className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest flex items-center gap-2">
                                <Info className="h-2.5 w-2.5" /> {item.file.name.slice(-15)}
                              </span>
                              <span className="text-[9px] text-muted-foreground/20">•</span>
                              <span className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-widest">
                                {(item.file.size / 1024).toFixed(1)} KB Archive
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 shrink-0">
                          {item.status === "error" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 text-primary hover:bg-primary/10 rounded-xl"
                              onClick={() => retryItem(item.id)}
                            >
                              <RefreshCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {item.status === "completed" && item.resultId && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-9 text-[10px] font-bold uppercase tracking-widest text-green-600 border-green-600/20 bg-green-500/5 hover:bg-green-500/10 rounded-xl px-4"
                              onClick={() => router.push(`/app/transcripts?id=${item.resultId}`)}
                            >
                              Explore <TrendingUp className="h-3 w-3 ml-2 opacity-50" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all rounded-xl"
                            onClick={() => removeItem(item.id)}
                            disabled={item.status === "uploading" || item.status === "processing"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {(item.status !== "idle" || item.progress > 0) && (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-1 duration-500">
                          <div className="flex justify-between items-end">
                            <div className="flex items-center gap-3">
                              {item.status === "uploading" && <div className="h-1.5 w-1.5 bg-primary rounded-full animate-pulse" />}
                              {item.status === "processing" && <Sparkles className="h-3.5 w-3.5 text-primary animate-pulse" />}
                              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${item.status === "error" ? "text-destructive" :
                                  item.status === "completed" ? "text-green-600" : "text-primary"
                                }`}>
                                {item.status === "uploading" ? "Transporting Archive" :
                                  item.status === "processing" ? "Extracting Intel" :
                                    item.status === "completed" ? "Synthesis Ready" :
                                      item.status === "error" ? "Operational Fault" : "Queued"}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono font-black text-muted-foreground/40">{item.progress}%</span>
                          </div>
                          <div className="relative h-1 w-full bg-muted/20 rounded-full overflow-hidden shadow-inner">
                            <div
                              className={`absolute inset-y-0 left-0 transition-all duration-1000 ease-out rounded-full ${item.status === "error" ? "bg-destructive" :
                                  item.status === "completed" ? "bg-green-500" : "bg-primary"
                                }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          {item.error && (
                            <p className="text-[9px] text-destructive font-bold uppercase tracking-widest mt-2 bg-destructive/10 px-3 py-1.5 rounded-lg border border-destructive/10">
                              {item.error}
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar info - ALIGNED WITH ANALYTICS CARDS */}
        <div className="lg:col-span-4 space-y-8">
          <Card className="border-border/40 bg-background/40 backdrop-blur-md shadow-sm rounded-[2.5rem] overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-6">
              <Zap className="h-5 w-5 text-primary opacity-20" />
            </div>
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                Extraction Pipeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 p-8 pt-0 pb-10">
              <div className="space-y-6 text-sm">
                <div className="group flex items-start gap-4 transition-transform hover:translate-x-1 duration-300">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-border/20">
                    <span className="text-xs font-black text-primary">1</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground">Decision Mapping</p>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-light">Llama 3.3 identifies consensus points with evidentiary backing.</p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 transition-transform hover:translate-x-1 duration-300">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-border/20">
                    <span className="text-xs font-black text-primary">2</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground">Action Tracking</p>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-light">Granular extraction of milestones and projected deadlines.</p>
                  </div>
                </div>

                <div className="group flex items-start gap-4 transition-transform hover:translate-x-1 duration-300">
                  <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 border border-border/20">
                    <span className="text-xs font-black text-primary">3</span>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-black uppercase tracking-widest text-foreground">Sentiment Flow</p>
                    <p className="text-xs text-muted-foreground/80 leading-relaxed font-light">DistilBERT quantifies emotional trajectories across segments.</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-black text-muted-foreground/40">Indexing Engine</span>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                    <span className="text-[9px] uppercase tracking-[0.1em] font-black text-green-600">Sync Online</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/40 bg-primary/5 backdrop-blur-sm rounded-[2rem] overflow-hidden shadow-none border-primary/10 transition-all hover:bg-primary/10 duration-500">
            <CardContent className="p-8">
              <div className="flex items-start gap-5">
                <div className="h-12 w-12 rounded-2xl bg-background flex items-center justify-center shrink-0 shadow-lg border border-primary/10 rotate-3">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h4 className="text-sm font-bold tracking-tight text-foreground uppercase tracking-widest px-1">Privacy Shield</h4>
                  <p className="text-[11px] leading-relaxed text-muted-foreground/60 mt-2 font-light">
                    Transcripts are processed in isolated vector spaces. We do not utilize workspace data for training public LLMs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Meeting archive - REFINED FOR CONSISTENCY */}
      <div className="pt-12 max-w-7xl mx-auto w-full px-4 sm:px-6">
        <div className="mb-8 flex items-end justify-between px-2">
          <div className="space-y-2">
            <h2 className="font-serif text-3xl tracking-tight">Intelligence Journal</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60">Persistent Storage Repository</p>
          </div>
          <Badge variant="secondary" className="font-mono text-[10px] font-black bg-primary/5 text-primary px-3 h-8 rounded-xl border border-primary/10">
            {(meetings as BackendMeeting[]).length} Archives
          </Badge>
        </div>

        {loadingMeetings ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6">
            <Loader2 className="animate-spin h-12 w-12 text-primary opacity-20" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/40 animate-pulse">Scanning Neural Cache</p>
          </div>
        ) : (meetings as BackendMeeting[]).length === 0 ? (
          <div className="py-24 text-center space-y-6 bg-muted/5 rounded-[3rem] border-2 border-dashed border-border/20 max-w-4xl mx-auto">
            <div className="h-20 w-20 rounded-full bg-muted/20 mx-auto flex items-center justify-center">
              <FileText className="h-10 w-10 text-muted-foreground/20" />
            </div>
            <p className="text-sm font-light text-muted-foreground tracking-wide px-4">Workspace contains no indexed intelligence archives.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(meetings as BackendMeeting[]).map((m: BackendMeeting) => {
              const mapped = normalizeMeeting(m)
              return (
                <Card
                  key={m._id}
                  className="group relative border-border/40 bg-background/40 backdrop-blur-md rounded-[2.5rem] transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:border-primary/40 cursor-pointer overflow-hidden"
                  onClick={() => router.push(`/app/transcripts?id=${m._id}`)}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--color-primary),transparent)] opacity-0 group-hover:opacity-[0.03] transition-opacity duration-700" />
                  <CardContent className="p-7 flex flex-col gap-6 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-muted/40 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-700 group-hover:rotate-[-6deg] group-hover:shadow-xl group-hover:shadow-primary/20">
                        <FileText className="h-7 w-7 transition-all duration-500" />
                      </div>
                      <Badge
                        className="border-none font-black uppercase tracking-[0.2em] text-[8px] py-1 px-3 h-6 rounded-lg shadow-sm"
                        style={emotionBadgeStyle(mapped.dominantEmotion)}
                      >
                        {mapped.dominantEmotion}
                      </Badge>
                    </div>

                    <div className="space-y-1.5 min-w-0">
                      <h4 className="text-xl text-foreground tracking-tight group-hover:text-primary transition-colors truncate pr-8">
                        {mapped.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{mapped.date}</span>
                        <span className="text-muted-foreground/20 font-bold">•</span>
                        <span className="text-[10px] text-muted-foreground/60 font-bold uppercase tracking-widest">{mapped.words.toLocaleString()} words</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <div className="flex -space-x-2">
                        {mapped.avatars.slice(0, 3).map((speaker: string, i: number) => (
                          <div key={i} className="h-7 w-7 rounded-sm border-2 border-background bg-secondary flex items-center justify-center text-[8px] font-black uppercase tracking-tighter" style={{ borderRadius: '4px' }}>
                            {getInitials(speaker)}
                          </div>
                        ))}
                        {mapped.speakers > 3 && (
                          <div className="h-7 w-7 rounded-sm border-2 border-background bg-primary/10 flex items-center justify-center text-[8px] font-black text-primary" style={{ borderRadius: '4px' }}>
                            +{mapped.speakers - 3}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all duration-300 rounded-xl"
                        onClick={(e) => { e.stopPropagation(); handleDelete(m._id); }}
                        disabled={deleteMutation.isPending && deleteMutation.variables === m._id}
                      >
                        {deleteMutation.isPending && deleteMutation.variables === m._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
