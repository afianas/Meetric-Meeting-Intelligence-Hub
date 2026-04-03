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
  ArrowRight
} from "lucide-react"
import { uploadTranscript, getMeetings, deleteMeeting, BackendMeeting, normalizeMeeting } from "@/lib/api"
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

  // Emotion styling helper
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
    
    // Find all processable items
    const idleItems = uploadQueue.filter(item => item.status === "idle" || item.status === "error");
    
    for (const item of idleItems) {
      // Re-fetch current state to ensure we don't process deleted items
      // (Simplified here as we iterate the captured list)
      
      try {
        // Step 1: Simulated Upload (0-30%)
        updateItem(item.id, { status: "uploading", progress: 10 });
        const uploadProgressInterval = setInterval(() => {
          setUploadQueue(prev => prev.map(queueItem => 
            queueItem.id === item.id && queueItem.progress < 30 
              ? { ...queueItem, progress: queueItem.progress + 5 } 
              : queueItem
          ));
        }, 100);

        // Transition to Processing (AI Extraction)
        setTimeout(() => {
          clearInterval(uploadProgressInterval);
          updateItem(item.id, { status: "processing", progress: 40 });
        }, 500);

        // Step 2: Actual API Call
        const result = await uploadTranscript(item.file, item.meetingName);
        
        // Step 3: Success
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
        // We continue to next item in batch even if one fails
      }
    }
    
    setIsBatchProcessing(false);
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

  const hasProcessableItems = uploadQueue.some(item => item.status === "idle" || item.status === "error");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold italic text-foreground">Curate Your Conversations</h1>
        <p className="mt-2 max-w-xl text-muted-foreground">
          Transform unstructured meeting transcripts into organized editorial intelligence.
          Upload <Badge variant="outline" className="text-xs">.txt</Badge> or{" "}
          <Badge variant="outline" className="text-xs">.vtt</Badge> files to begin extraction.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Drop zone */}
          <Card
            className={`border-2 border-dashed transition-all duration-200 ${isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"
              }`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { 
              e.preventDefault(); 
              setIsDragging(false); 
              handleFilesSelected(e.dataTransfer.files);
            }}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple
              onChange={e => handleFilesSelected(e.target.files)} 
              accept=".txt,.vtt" 
            />
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
                <Upload className={`h-8 w-8 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">Drop your transcripts here</h3>
              <p className="mt-1 text-sm text-muted-foreground">Supports multiple .txt and .vtt files</p>
              <Button 
                className="mt-6 bg-primary" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isBatchProcessing}
              >
                Browse Files
              </Button>
              {globalError && (
                <div className="mt-4 flex items-center gap-2 text-xs text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle className="h-3 w-3" /> {globalError}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Queue */}
          {uploadQueue.length > 0 && (
            <Card className="border-border/40 shadow-sm overflow-hidden">
              <CardHeader className="bg-muted/30 px-6 py-4 flex flex-row items-center justify-between border-b">
                <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">Processing Queue</CardTitle>
                <div className="flex items-center gap-3">
                   <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs h-8 text-muted-foreground hover:text-foreground"
                    onClick={() => setUploadQueue([])}
                    disabled={isBatchProcessing}
                  >
                    Clear All
                  </Button>
                  <Button 
                    size="sm" 
                    className="text-xs h-8 bg-primary" 
                    disabled={!hasProcessableItems || isBatchProcessing}
                    onClick={processBatch}
                  >
                    {isBatchProcessing ? (
                      <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Processing...</>
                    ) : (
                      <><Play className="h-3 w-3 mr-2" /> Process All</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-border/40">
                  {uploadQueue.map((item) => (
                    <div key={item.id} className="p-4 flex flex-col gap-3 transition-colors hover:bg-muted/10">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                            item.status === "completed" ? "bg-green-100" : 
                            item.status === "error" ? "bg-red-100" : "bg-primary/10"
                          }`}>
                            {item.status === "completed" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                             item.status === "error" ? <AlertCircle className="h-5 w-5 text-red-600" /> :
                             item.status === "idle" ? <FileText className="h-5 w-5 text-primary" /> :
                             <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <Input
                              value={item.meetingName}
                              onChange={(e) => updateItem(item.id, { meetingName: e.target.value })}
                              disabled={item.status !== "idle" && item.status !== "error"}
                              className="h-8 py-0 px-2 text-sm font-medium bg-transparent border-transparent hover:border-border/60 focus:bg-background focus:border-primary transition-all truncate"
                            />
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5 ml-2">
                              {item.file.name} • {(item.file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {item.status === "error" && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-primary hover:bg-primary/10"
                              onClick={() => retryItem(item.id)}
                            >
                              <RefreshCcw className="h-4 w-4" />
                            </Button>
                          )}
                          {item.status === "completed" && item.resultId && (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 text-green-600 hover:bg-green-50"
                              onClick={() => router.push(`/app/transcripts?id=${item.resultId}`)}
                            >
                              View <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-red-500"
                            onClick={() => removeItem(item.id)}
                            disabled={item.status === "uploading" || item.status === "processing"}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {(item.status !== "idle" || item.progress > 0) && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] uppercase tracking-wider font-bold">
                            <span className={
                              item.status === "error" ? "text-red-600" : 
                              item.status === "completed" ? "text-green-600" : "text-primary"
                            }>
                              {item.status === "uploading" ? "Uploading Source" : 
                               item.status === "processing" ? "AI Extraction & Indexing" : 
                               item.status === "completed" ? "Ready" : 
                               item.status === "error" ? "Failed" : "Waiting"}
                            </span>
                            <span className="text-muted-foreground">{item.progress}%</span>
                          </div>
                          <Progress value={item.progress} className={`h-1.5 ${item.status === "error" ? "bg-red-100" : ""}`} />
                          {item.error && <p className="text-[10px] text-red-600 font-medium mt-1">{item.error}</p>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar info */}
        <Card className="h-fit">
          <CardHeader className="pb-3 border-b">
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Processing Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <span><strong className="text-foreground font-medium">Llama 3.3-70B Extraction:</strong> LLM identifies decisions, action items, and participants automatically.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <span><strong className="text-foreground font-medium">DistilBERT Sentiment:</strong> Real-time emotional tone mapping across every dialogue segment.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
              <span><strong className="text-foreground font-medium">FAISS RAG Search:</strong> 384-dim MiniLM embeddings ensure instant semantic traceability.</span>
            </div>
            <div className="mt-4 pt-4 border-t text-[10px] uppercase tracking-widest leading-loose">
              System status: <span className="text-green-600 font-bold ml-1">Indexing Service Online</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Meeting archive */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-foreground">Indexed Meetings</h2>
          <Badge variant="outline">{(meetings as BackendMeeting[]).length} total</Badge>
        </div>
        {loadingMeetings ? (
          <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
        ) : (meetings as BackendMeeting[]).length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground"><FileText className="h-8 w-8 mb-3 opacity-40" /><p>No meetings indexed yet. Upload a transcript above.</p></CardContent></Card>
        ) : (
          <div className="space-y-3">
            {(meetings as BackendMeeting[]).map((m: BackendMeeting) => {
              const mapped = normalizeMeeting(m)
              return (
                <Card 
                  key={m._id} 
                  className="transition-all hover:shadow-md hover:border-primary/40 cursor-pointer group"
                  onClick={() => router.push(`/app/transcripts?id=${m._id}`)}
                >
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">{mapped.title}</p>
                        <p className="text-xs text-muted-foreground">{mapped.date} • {mapped.words.toLocaleString()} words • {mapped.speakers} speakers</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className="hidden md:inline-flex border-none font-sans font-bold uppercase tracking-widest text-[10px]"
                        style={emotionBadgeStyle(mapped.dominantEmotion)}
                      >
                        {mapped.dominantEmotion}
                      </Badge>
                      <Button
                        variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600"
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
