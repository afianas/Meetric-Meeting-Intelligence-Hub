"use client"

import { useState, useMemo } from "react"
import { getMeetings, downloadReport, BackendMeeting, MappedDecision, normalizeDecision } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, CheckCircle2, Loader2, AlertCircle, ChevronDown, ChevronUp, RefreshCw } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

export default function DecisionTrackerPage() {
  const { data: meetings = [], isLoading: loading, error, refetch: load } = useQuery({
    queryKey: ['meetings'],
    queryFn: getMeetings,
  })

  const decisions = useMemo(() => {
    return (meetings as BackendMeeting[]).flatMap(m => 
      (m.analysis?.decisions || []).map((d, idx) => normalizeDecision(d, idx, m._id, m.analysis))
    )
  }, [meetings])

  const [meetingFilter, setMeetingFilter] = useState("all")
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)

  const meetingOptions = useMemo(() => Array.from(new Set(decisions.map(d => d.meetingId))).map(id => {
    const d = decisions.find(x => x.meetingId === id)
    return { id, name: d?.meeting || id }
  }), [decisions])

  const filtered = useMemo(() => meetingFilter === "all" ? decisions : decisions.filter(d => d.meetingId === meetingFilter), [decisions, meetingFilter])

  const handleExport = async (format: "csv" | "pdf") => {
    setDownloading(true)
    try {
      // Use first meeting with decisions for export, or all
      const targetMeeting = meetingFilter !== "all"
        ? (meetings as BackendMeeting[]).find((m) => m._id === meetingFilter)
        : (meetings as BackendMeeting[])[0]
      if (targetMeeting) await downloadReport(targetMeeting, format)
    } catch { /* ignore */ }
    setDownloading(false)
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="animate-pulse space-y-2"><div className="h-8 w-64 rounded bg-muted" /></div>
      {Array(3).fill(0).map((_,i) => <Card key={i}><CardContent className="h-24 animate-pulse bg-muted/30 p-4 rounded" /></Card>)}
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      <Button onClick={() => load()}>Retry</Button>
    </div>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold text-foreground">Decision Tracker</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">A curated log of all AI-extracted decisions across your meetings with full traceability to source segments.</p>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Filter by Meeting</p>
            <Select value={meetingFilter} onValueChange={setMeetingFilter}>
              <SelectTrigger className="w-52"><SelectValue placeholder="All Meetings" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Meetings</SelectItem>
                {meetingOptions.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {filtered.length === 0 ? (
            <Card><CardContent className="flex items-center justify-center py-12 text-muted-foreground italic">No decisions recorded yet. Upload a meeting transcript to extract decisions.</CardContent></Card>
          ) : (
            filtered.map(decision => (
              <Card key={decision.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground">{decision.date} • {decision.meeting}</p>
                      <h3 className="mt-1 font-serif text-base font-semibold text-foreground leading-snug">{decision.title}</h3>
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/10"><CheckCircle2 className="h-3 w-3 text-primary" /></div>
                        <span className="text-xs text-muted-foreground">AI-extracted decision</span>
                      </div>

                      {/* Evidence segments */}
                      {decision.evidence.length > 0 && (
                        <div className="mt-3">
                          <button
                            className="flex items-center gap-1 text-xs text-primary hover:underline"
                            onClick={() => setExpandedId(expandedId === decision.id ? null : decision.id)}
                          >
                            {expandedId === decision.id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                            {decision.evidence.length} source segment{decision.evidence.length > 1 ? "s" : ""} (Evidence)
                          </button>
                          {expandedId === decision.id && (
                            <div className="mt-2 space-y-2">
                              {decision.evidence.map((ev, i) => (
                                <div key={i} className="rounded-lg bg-muted/50 p-3 border-l-2 border-primary/40">
                                  <p className="text-xs font-medium text-primary">{ev.speaker}</p>
                                  <blockquote className="mt-1 text-xs italic text-muted-foreground">"{ev.text}"</blockquote>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <div>
          <Card>
            <CardContent className="p-5">
              <h3 className="font-medium text-foreground">Tracking Summary</h3>
              <div className="mt-4">
                <p className="text-sm text-muted-foreground">Decisions shown</p>
                <p className="mt-1 font-serif text-4xl font-bold text-primary">{filtered.length}</p>
              </div>
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total meetings</span>
                  <span className="font-medium text-foreground">{(meetings as BackendMeeting[]).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">With evidence</span>
                  <span className="font-medium text-foreground">{filtered.filter(d => d.evidence.length > 0).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}