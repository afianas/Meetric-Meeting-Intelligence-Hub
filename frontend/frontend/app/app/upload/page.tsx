"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Upload, FileText, CheckCircle2, AlertCircle, Sparkles, Loader2, Trash2 } from "lucide-react"
import { uploadTranscript, getMeetings, deleteMeeting, BackendMeeting, normalizeMeeting } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

type UploadState = "idle" | "uploading" | "processing" | "completed" | "error"

export default function UploadPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isDragging, setIsDragging] = useState(false)
  const [uploadState, setUploadState] = useState<UploadState>("idle")
  const [uploadProgress, setUploadProgress] = useState(0)
  const [currentFile, setCurrentFile] = useState<{ name: string; size: string } | null>(null)
  const [result, setResult] = useState<BackendMeeting | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [meetingName, setMeetingName] = useState("")

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

  const uploadMutation = useMutation({
    mutationFn: async ({ file, name }: { file: File; name?: string }) => {
      return await uploadTranscript(file, name)
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
      setUploadProgress(100)
      setUploadState("completed")
      setResult(data)
      setMeetingName("")
    },
    onError: (err: any) => {
      setUploadState("error")
      setError(err?.message || "Upload failed. Please try again.")
    }
  })

  const deleteMutation = useMutation({
    mutationFn: deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meetings'] })
    }
  })

  const processFile = async (file: File) => {
    const allowedExts = [".txt", ".vtt"]
    const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    if (!allowedExts.includes(ext)) {
      setError(`Invalid file type. Please upload a .txt or .vtt file.`)
      return
    }

    setCurrentFile({ name: file.name, size: `${(file.size / 1024).toFixed(1)} KB` })
    setUploadState("uploading")
    setUploadProgress(0)
    setError(null)
    setResult(null)

    // Animate progress to 60% while uploading
    const interval = setInterval(() => {
      setUploadProgress(p => { if (p >= 60) { clearInterval(interval); return p; } return p + 4 })
    }, 150)

    setUploadState("processing")
    
    uploadMutation.mutate({ file, name: meetingName.trim() || undefined }, {
      onSettled: () => {
        clearInterval(interval)
      }
    })
  }

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id)
  }

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
        <div className="lg:col-span-2 space-y-4">
          {/* Meeting name input */}
          <div className="flex gap-3">
            <Input
              placeholder="Optional: Enter a custom meeting name..."
              value={meetingName}
              onChange={e => setMeetingName(e.target.value)}
              className="flex-1"
            />
          </div>

          {/* Drop zone */}
          <Card
            className={`border-2 border-dashed transition-all duration-200 ${
              isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border hover:border-primary/50"
            }`}
            onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={e => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) processFile(f) }}
          >
            <input type="file" ref={fileInputRef} className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f) }} accept=".txt,.vtt" />
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className={`flex h-16 w-16 items-center justify-center rounded-full transition-colors ${isDragging ? "bg-primary/20" : "bg-muted"}`}>
                <Upload className={`h-8 w-8 transition-colors ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <h3 className="mt-4 text-lg font-medium text-foreground">Drop your transcript here</h3>
              <p className="mt-1 text-sm text-muted-foreground">Supports .txt and .vtt transcript files</p>
              <Button className="mt-6 bg-primary" onClick={() => fileInputRef.current?.click()} disabled={uploadState === "uploading" || uploadState === "processing"}>
                Browse Files
              </Button>
            </CardContent>
          </Card>

          {/* Upload progress */}
          {uploadState !== "idle" && currentFile && (
            <Card className={`border transition-all ${uploadState === "error" ? "border-red-200 bg-red-50" : uploadState === "completed" ? "border-green-200 bg-green-50/40" : "border-primary/20 bg-primary/5"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${uploadState === "error" ? "bg-red-100" : "bg-primary/10"}`}>
                    {uploadState === "error" ? <AlertCircle className="h-5 w-5 text-red-600" /> :
                     uploadState === "completed" ? <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                     <Loader2 className="h-5 w-5 text-primary animate-spin" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{currentFile.name}</p>
                        <p className="text-xs text-muted-foreground">{currentFile.size}</p>
                      </div>
                      <p className="text-lg font-semibold text-primary">{uploadProgress}%</p>
                    </div>
                    <Progress value={uploadProgress} className="mt-2 h-2" />
                    <div className="mt-2 flex items-center gap-6 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><CheckCircle2 className={`h-3 w-3 ${uploadProgress > 0 ? "text-green-600" : "text-muted-foreground/30"}`} /> Uploaded</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className={`h-3 w-3 ${uploadState === "processing" || uploadState === "completed" || uploadState === "error" ? "text-primary" : "text-muted-foreground/30"}`} /> AI Extraction</span>
                      <span className="flex items-center gap-1"><CheckCircle2 className={`h-3 w-3 ${uploadState === "completed" ? "text-green-600" : "text-muted-foreground/30"}`} /> Indexed</span>
                    </div>
                  </div>
                </div>

                {error && <p className="mt-3 text-sm text-red-600 font-medium">{error}</p>}

                {/* Result summary */}
                {uploadState === "completed" && result && (
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-green-200 pt-4">
                    <div className="text-center">
                      <p className="font-serif text-xl sm:text-2xl font-bold text-primary">{result.analysis?.date || "—"}</p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Date</p>
                    </div>
                    <div className="text-center">
                      <p className="font-serif text-xl sm:text-2xl font-bold text-primary">{result.analysis?.word_count?.toLocaleString() || "—"}</p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Words</p>
                    </div>
                    <div className="text-center">
                      <p className="font-serif text-xl sm:text-2xl font-bold text-primary">{result.analysis?.speakers_identified || "—"}</p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Speakers</p>
                    </div>
                    <div className="text-center">
                      <p className="font-serif text-xl sm:text-2xl font-bold text-primary">{result.analysis?.decisions?.length || 0}</p>
                      <p className="text-xs uppercase tracking-wider text-muted-foreground">Decisions</p>
                    </div>
                    <div className="col-span-2 sm:col-span-4 text-center mt-2">
                      <p className="text-sm font-medium text-green-700">✓ "{result.analysis?.meeting_name}" successfully indexed</p>
                      <Button className="mt-3 bg-primary" onClick={() => router.push("/app")}>View Dashboard →</Button>
                    </div>
                  </div>
                )}

                {uploadState === "error" && (
                  <Button className="mt-3" variant="outline" onClick={() => { setUploadState("idle"); setError(null) }}>Try Again</Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar info */}
        <Card className="h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base"><Sparkles className="h-4 w-4 text-primary" /> Processing Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2"><div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" /><span>LLM extracts decisions & action items via Llama 3.3-70B</span></div>
            <div className="flex items-start gap-2"><div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" /><span>Segments are classified with DistilBERT emotion analysis</span></div>
            <div className="flex items-start gap-2"><div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" /><span>384-dim MiniLM embeddings indexed into FAISS for RAG search</span></div>
            <div className="flex items-start gap-2"><div className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" /><span>Decision traceability links insights to source segments</span></div>
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
                 <Card key={m._id} className="transition-shadow hover:shadow-md">
                   <CardContent className="flex items-center justify-between p-4">
                     <div className="flex items-center gap-4">
                       <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted"><FileText className="h-5 w-5 text-muted-foreground" /></div>
                       <div>
                         <p className="font-medium text-foreground">{mapped.title}</p>
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
                         onClick={() => handleDelete(m._id)} disabled={deleteMutation.isPending && deleteMutation.variables === m._id}
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