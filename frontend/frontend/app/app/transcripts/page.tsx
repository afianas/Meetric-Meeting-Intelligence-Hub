"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { ChevronLeft, Download, Clock, Users, MessageSquare, CheckCircle2, Loader2, AlertCircle, FileText, Sparkles } from "lucide-react"
import Link from "next/link"
import { getMeeting, getMeetings, downloadReport, normalizeMeeting, normalizeDecision, normalizeActionItem, BackendMeeting, BackendSegment, updateTaskStatus, getInitials } from "@/lib/api"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"

function avatarFor(name: string) {
  return null; // No human images
}

function emotionBadgeStyle(emotion: string) {
  const EMOTION_COLORS: Record<string, string> = {
    agreement: "#15803d",
    conflict: "#b91c1c",
    concern: "#d97706",
    uncertainty: "#7c3aed",
    neutral: "#64748b"
  }
  const e = (emotion || "neutral").toLowerCase()
  const color = EMOTION_COLORS[e] || EMOTION_COLORS.neutral
  return {
    backgroundColor: `${color}15`,
    color: color,
  }
}



function TranscriptsContent() {
  const queryClient = useQueryClient()
  const searchParams = useSearchParams()
  const meetingId = searchParams.get("id")
  const segmentIdParam = searchParams.get("segment")

  const { data: meeting, isLoading: loading, error } = useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: () => getMeeting(meetingId!),
    enabled: !!meetingId
  })

  // To list options if no meeting ID is provided
  const { data: allMeetings = [], isLoading: loadingMeetings } = useQuery({
    queryKey: ['meetings'],
    queryFn: getMeetings,
    enabled: !meetingId
  })

  const taskMutation = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number, status: string }) => updateTaskStatus(meetingId!, taskId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] })
  })

  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null)
  const [highlightedContextIds, setHighlightedContextIds] = useState<string[]>([])
  const [isFromAI, setIsFromAI] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const segmentRefs = useRef<Record<string, HTMLDivElement>>({})

  const scrollToSegment = (segmentId: string) => {
    setActiveSegmentId(segmentId)
    const el = segmentRefs.current[segmentId]
    if (el) {
      const yOffset = -120;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setTimeout(() => setActiveSegmentId(null), 3000)
  }

  // Handle URL deep linking
  useEffect(() => {
    if (segmentIdParam && meeting && (meeting as BackendMeeting).segments) {
      const segments = (meeting as BackendMeeting).segments
      const idx = segments.findIndex(s => s.segment_id === segmentIdParam)
      if (idx !== -1) {
        setIsFromAI(true)
        setActiveSegmentId(segmentIdParam)
        
        // Get context (±2 segments)
        const contextIds = segments
          .slice(Math.max(0, idx - 2), Math.min(segments.length, idx + 3))
          .map(s => s.segment_id)
        setHighlightedContextIds(contextIds)

        // Scroll with a slight delay to ensure layout is ready
        const timer = setTimeout(() => {
          const el = segmentRefs.current[segmentIdParam]
          if (el) {
            const yOffset = -120;
            const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          }
        }, 500)

        // Fade out highlights after 5s
        const fadeTimer = setTimeout(() => {
          setActiveSegmentId(null)
          setHighlightedContextIds([])
        }, 5000)

        return () => {
          clearTimeout(timer)
          clearTimeout(fadeTimer)
        }
      }
    }
  }, [segmentIdParam, meeting])

  if (!meetingId) return (
    <div className="flex flex-col items-center justify-center py-16 px-4 w-full">
      {/* ... (keep existing select transcript view) */}
      <div className="text-center max-w-lg mb-8">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Select a Transcript</h1>
        <p className="mt-2 text-muted-foreground">Choose a meeting from the list below to view its full transcript and extract insights.</p>
      </div>

      {loadingMeetings ? (
        <div className="flex justify-center p-10"><Loader2 className="animate-spin h-6 w-6 text-muted-foreground" /></div>
      ) : (allMeetings as BackendMeeting[]).length === 0 ? (
        <div className="flex flex-col items-center py-12 gap-4">
          <FileText className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground">No meetings found. Please upload a transcript first.</p>
          <Link href="/app/upload"><Button>Go to Uploads</Button></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-5xl">
          {(allMeetings as BackendMeeting[]).map(m => {
            const mapped = normalizeMeeting(m);
            return (
              <Link href={`/app/transcripts?id=${m._id}`} key={m._id}>
                <Card className="hover:bg-muted/10 border-border/40 cursor-pointer transition-all h-full">
                  <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground line-clamp-2">{mapped.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{mapped.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-auto pt-2 border-t border-border/50">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {mapped.speakers}</span>
                      <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {mapped.words.toLocaleString()}w</span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-muted" />
      <div className="grid grid-cols-3 gap-4">{Array(3).fill(0).map((_, i) => <div key={i} className="h-40 rounded bg-muted" />)}</div>
    </div>
  )

  if (error || !meeting) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="text-muted-foreground">{error instanceof Error ? error.message : "Meeting not found"}</p>
      <Link href="/app"><Button variant="outline">← Back to Dashboard</Button></Link>
    </div>
  )

  const mapped = normalizeMeeting(meeting as BackendMeeting)
  const segments: BackendSegment[] = (meeting as BackendMeeting).segments || []
  const decisions = ((meeting as BackendMeeting).analysis?.decisions || []).map((d, i) => normalizeDecision(d, i, (meeting as BackendMeeting)._id, (meeting as BackendMeeting).analysis))
  const actionItems = ((meeting as BackendMeeting).analysis?.action_items || []).map((a, i) => normalizeActionItem(a, i, (meeting as BackendMeeting)._id, mapped.title))
  const uniqueSpeakers = Array.from(new Set(segments.map(s => s.speaker).filter(Boolean)))

  const handleDownload = async (format: "csv" | "pdf") => {
    if (!meeting) return
    setDownloading(true)
    try { await downloadReport(meeting, format) } catch { /* ignore */ }
    setDownloading(false)
  }

  return (
    <div className="relative space-y-6">
      {/* AI Source Banner */}
      {isFromAI && (
        <div className="sticky top-0 z-40 -mt-6 -mx-6 mb-6 bg-primary/10 border-b border-primary/20 px-8 py-2.5 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Viewing source from AI response</span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 text-xs text-primary hover:bg-primary/20" onClick={() => setIsFromAI(false)}>Dismiss</Button>
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/app" className="text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="h-4 w-4" /> Dashboard
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-foreground font-medium">{mapped.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">{mapped.title}</h1>
          <div className="mt-2 flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{mapped.date}</span>
            <span className="flex items-center gap-1"><Users className="h-4 w-4" />{mapped.speakers} speakers</span>
            <span className="flex items-center gap-1"><MessageSquare className="h-4 w-4" />{mapped.words.toLocaleString()} words</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => handleDownload("csv")} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleDownload("pdf")} disabled={downloading}>
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Transcript segments */}
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-lg font-semibold text-foreground">Transcript Segments</h2>
            {highlightedContextIds.length > 0 && (
              <Badge variant="outline" className="animate-in fade-in slide-in-from-right-4 duration-500 bg-primary/5 text-primary border-primary/20">
                Context around this discussion
              </Badge>
            )}
          </div>
          
          {segments.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-muted-foreground">No segments available for this meeting.</CardContent></Card>
          ) : (
            segments.map((seg) => {
              const isActive = activeSegmentId === seg.segment_id
              const isInContext = highlightedContextIds.includes(seg.segment_id)
              
              return (
                <div
                  key={seg.segment_id}
                  ref={el => { if (el) segmentRefs.current[seg.segment_id] = el }}
                  className={`flex gap-4 rounded-lg p-3 transition-all duration-700 
                    ${isActive ? "bg-primary/15 ring-2 ring-primary/40 animate-source-pulse" : 
                      isInContext ? "bg-primary/5 border border-primary/10 animate-highlight-fade" : 
                    "hover:bg-muted/20 border border-transparent hover:border-border/10"}`}
                >
                  <Avatar className="h-10 w-10 flex-shrink-0 border border-border/40 bg-muted">
                    <AvatarFallback className="font-bold text-muted-foreground">{getInitials(seg.speaker)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-foreground">{seg.speaker || "Unknown"}</span>
                      {seg.role && seg.role !== "Unknown" && <span className="text-xs text-muted-foreground">({seg.role})</span>}
                      {seg.emotion && (
                        <Badge 
                          className="text-[10px] border-none font-sans font-bold uppercase tracking-widest"
                          style={emotionBadgeStyle(seg.emotion)}
                        >
                          {seg.emotion}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{seg.text}</p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Decisions */}
          {decisions.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Decisions ({decisions.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {decisions.map((d) => (
                  <div key={d.id} className="group">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                      <p className="text-sm text-foreground leading-snug">{d.title}</p>
                    </div>
                    {d.evidence.length > 0 && (
                      <button
                        className="ml-6 mt-1 text-xs text-primary hover:underline"
                        onClick={() => scrollToSegment(d.evidence[0].segment_id)}
                      >
                        → View in transcript
                      </button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action items */}
          {actionItems.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Action Items ({actionItems.length})</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {actionItems.map(item => (
                  <button
                    key={item.id}
                    className="flex items-start gap-2 w-full text-left hover:bg-muted/30 p-1.5 -mx-1.5 rounded-md transition-colors"
                    onClick={() => taskMutation.mutate({ taskId: item.id, status: item.completed ? "pending" : "completed" })}
                    disabled={taskMutation.isPending && taskMutation.variables?.taskId === item.id}
                  >
                    {taskMutation.isPending && taskMutation.variables?.taskId === item.id ? (
                      <Loader2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground animate-spin" />
                    ) : (
                      <CheckCircle2 className={`mt-0.5 h-4 w-4 flex-shrink-0 ${item.completed ? "text-green-600" : "text-muted-foreground"}`} />
                    )}
                    <div>
                      <p className={`text-sm ${item.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>{item.title}</p>
                      <p className={`text-xs ${item.completed ? "line-through text-muted-foreground/60" : "text-primary"}`}>{item.assignee.name} • {item.dueDate}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Speakers */}
          {uniqueSpeakers.length > 0 && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Speakers</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {uniqueSpeakers.map(name => (
                    <div key={name} className="flex items-center gap-2">
                      <Avatar className="h-7 w-7 border border-border/40 bg-muted">
                        <AvatarFallback className="text-[10px] font-bold text-muted-foreground">{getInitials(name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-foreground">{name || "Unknown"}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}

export default function TranscriptsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground flex items-center justify-center gap-2"><Loader2 className="h-4 w-4 animate-spin" />Loading transcript...</div>}>
      <TranscriptsContent />
    </Suspense>
  )
}