"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getSpeakerAnalytics, getSentimentFlow, getSentimentInsight, getMeetings } from "@/lib/api"
import { Sparkles, Loader2, RefreshCw, MessageSquare, User, TrendingUp, Info, LayoutGrid, List } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid
} from "recharts"
import Link from "next/link"

const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
]
function avatarFor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_POOL.length; return AVATAR_POOL[h]
}

const EMOTIONS = ["agreement", "concern", "conflict", "uncertainty", "neutral"]
const EMOTION_COLORS: Record<string, string> = {
  agreement: "#22c55e",
  conflict: "#ef4444",
  concern: "#f59e0b",
  uncertainty: "#c084fc",
  neutral: "#94a3b8"
}

export default function SpeakerIntelligencePage() {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("all")
  const [selectedSegment, setSelectedSegment] = useState<any>(null)
  const [viewMode, setViewMode] = useState<"speaker" | "meeting">("speaker")

  // Data Fetching
  const { data: meetingsData } = useQuery({ queryKey: ["meetings"], queryFn: getMeetings })
  const { data: analytics, isLoading: loadingStats, refetch: refetchStats } = useQuery({
    queryKey: ["analytics", selectedMeetingId],
    queryFn: () => getSpeakerAnalytics(selectedMeetingId === "all" ? undefined : selectedMeetingId),
  })
  const { data: flowData, isLoading: loadingFlow } = useQuery({
    queryKey: ["flow", selectedMeetingId],
    queryFn: () => getSentimentFlow(selectedMeetingId === "all" ? undefined : selectedMeetingId),
  })
  const { data: insightData, isLoading: loadingInsight } = useQuery({
    queryKey: ["insight", selectedMeetingId],
    queryFn: () => getSentimentInsight(selectedMeetingId === "all" ? undefined : selectedMeetingId),
  })

  const speakers = analytics?.speakers || []
  const flow = flowData?.flow || []

  // Transform radar data
  const radarData = useMemo(() => {
    return EMOTIONS.map(emotion => {
      const entry: any = { emotion: emotion.toUpperCase() }
      speakers.slice(0, 3).forEach(s => { entry[s.speaker] = s.emotion_distribution[emotion] || 0 })
      return entry
    })
  }, [speakers])

  // Transform flow data for chart
  const chartFlow = useMemo(() => {
    return flow.map((s, i) => ({
      index: i,
      val: s.emotion === "agreement" ? 10 : s.emotion === "conflict" ? -10 : s.emotion === "concern" ? -5 : s.emotion === "uncertainty" ? 5 : 0,
      ...s
    }))
  }, [flow])

  const isLoading = loadingStats || loadingFlow || loadingInsight

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      {/* Editorial Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold uppercase tracking-widest text-primary animate-in zoom-in duration-1000">
            <Sparkles className="h-3 w-3" /> Professional Intel
          </div>
        </div>
        <h1 className="font-serif text-5xl font-bold tracking-tight text-foreground leading-tight">
          How is your team <span className="text-primary italic">communicating?</span>
        </h1>
        <p className="text-muted-foreground text-lg leading-relaxed">
          Behavioral profiling and chronological sentiment mapping across your workspace dialogue.
        </p>

        {/* Global Controls Row */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-4">
          <Select value={selectedMeetingId} onValueChange={setSelectedMeetingId}>
            <SelectTrigger className="w-[280px] bg-background/50 backdrop-blur-sm border-border/60 shadow-lg focus:ring-primary/20 rounded-xl h-11">
              <SelectValue placeholder="Select Data Source" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/60 shadow-2xl">
              <SelectItem value="all" className="font-medium">Unified Workspace Analytics</SelectItem>
              {meetingsData?.map(m => (
                <SelectItem key={m._id} value={m._id} className="text-sm">{m.analysis.meeting_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={() => refetchStats()} className="h-11 w-11 rounded-xl shrink-0 group border-border/60">
            <RefreshCw className={`h-4 w-4 text-muted-foreground group-active:rotate-180 transition-transform ${isLoading ? "animate-spin" : ""}`} />
          </Button>
          {selectedMeetingId === "all" && meetingsData && (
            <Badge variant="secondary" className="h-11 px-4 rounded-xl bg-primary/10 text-primary border-none font-bold flex items-center gap-2">
              Analyzing {meetingsData.length} meetings
            </Badge>
          )}
        </div>
      </div>

      {/* Insight Hero Section */}
      <Card className="border-none bg-gradient-to-br from-primary/5 via-background to-background shadow-[0_20px_50px_rgba(0,0,0,0.05)] overflow-hidden relative group rounded-3xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,var(--color-primary),transparent)] opacity-10" />
        <CardContent className="p-10 md:p-14 relative text-center">
          <div className="flex flex-col items-center gap-6">
            <div className="p-4 rounded-3xl bg-primary/20 text-primary shadow-inner">
              <Sparkles className="h-8 w-8 animate-pulse" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground leading-tight italic max-w-4xl mx-auto">
                "{insightData?.insight || "Generating psychological summary..."}"
              </h2>
              <div className="flex items-center justify-center gap-4 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60 pt-2">
                <div className="h-px w-12 bg-border" />
                Executive Summary
                <div className="h-px w-12 bg-border" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dual Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Radar Map (40%) */}
        <Card className="lg:col-span-2 border-border/40 shadow-sm transition-all hover:border-primary/20 rounded-3xl bg-background/40 backdrop-blur-sm">
          <CardHeader className="p-8 pb-0">
            <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" />
                Collaborator Profile
              </span>
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] p-8 pt-0">
            {speakers.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
                  <PolarGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                  <PolarAngleAxis dataKey="emotion" tick={{ fontSize: 10, fontWeight: 700, fill: "#64748b" }} />
                  {speakers.slice(0, 3).map((s, i) => (
                    <Radar key={s.speaker} name={s.speaker} dataKey={s.speaker}
                      stroke={["#3b82f6", "#10b981", "#f59e0b"][i]} fill={["#3b82f6", "#10b981", "#f59e0b"][i]} fillOpacity={0.15} />
                  ))}
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground italic text-sm">Waiting for profile data...</div>
            )}
          </CardContent>
        </Card>

        {/* Chronological Flow (60%) */}
        <Card className="lg:col-span-3 border-border/40 shadow-sm rounded-3xl bg-background/40 backdrop-blur-sm overflow-hidden flex flex-col">
          <CardHeader className="p-8 pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Conversation Flow Dynamics
              </CardTitle>
              <div className="flex gap-2">
                <Badge variant="outline" className="text-[9px] bg-green-500/10 text-green-600 border-none">Agreement</Badge>
                <Badge variant="outline" className="text-[9px] bg-orange-500/10 text-orange-600 border-none">Conflict</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0 mt-8 min-h-[320px]">
            {flow.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartFlow} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  onClick={(e) => e?.activePayload && setSelectedSegment(e.activePayload[0].payload)}>
                  <defs>
                    <linearGradient id="sentimentGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="index" hide />
                  <YAxis hide domain={[-15, 15]} />
                  <Tooltip
                    cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                    content={({ active, payload }) => {
                      if (active && payload?.[0]) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-background/90 backdrop-blur-xl border border-border/50 p-4 rounded-2xl shadow-2xl max-w-[280px]">
                            <div className="flex items-center gap-3 mb-2">
                              <Avatar className="h-6 w-6">
                                <img src={avatarFor(d.speaker)} />
                              </Avatar>
                              <span className="text-[10px] font-bold text-foreground truncate">{d.speaker}</span>
                              <Badge style={{ backgroundColor: `${EMOTION_COLORS[d.emotion]}20`, color: EMOTION_COLORS[d.emotion] }} className="ml-auto text-[8px] border-none font-bold lowercase">{d.emotion}</Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-medium italic">"{d.text}"</p>
                            <div className="mt-3 text-[8px] font-bold uppercase tracking-widest text-primary flex items-center justify-center gap-2">
                              Click to explore dialogue <LayoutGrid className="h-2 w-2" />
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="val" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={1} fill="url(#sentimentGrad)"
                    activeDot={{ r: 8, strokeWidth: 4, stroke: "var(--color-background)", fill: "var(--color-primary)" }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground italic">Analyze meetings to map flow dynamics.</div>
            )}
          </CardContent>
          <div className="p-4 pt-0 border-t border-border/30 bg-muted/20 flex justify-center backdrop-blur-md">
            <p className="text-[10px] text-muted-foreground italic flex items-center gap-2 uppercase tracking-widest py-2">
              <Info className="h-3 w-3 text-primary opacity-50" /> Select nodes to perform granular dialogue inspection
            </p>
          </div>
        </Card>
      </div>

      {/* Explorer Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pb-20">
        {/* List (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-serif text-2xl font-bold flex items-center gap-3">
              Participant Analytics
            </h3>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-[200px]">
              <TabsList className="grid grid-cols-2 rounded-xl h-10 p-1 bg-muted/60 backdrop-blur-sm border border-border/50">
                <TabsTrigger value="speaker" className="rounded-lg text-[10px] font-bold uppercase tracking-wider flex gap-1.5 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <User className="h-3 w-3" /> Speaker
                </TabsTrigger>
                <TabsTrigger value="meeting" className="rounded-lg text-[10px] font-bold uppercase tracking-wider flex gap-1.5 transition-all data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  <List className="h-3 w-3" /> Meeting
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {viewMode === "speaker" ? (
              speakers.map(s => (
                <Card key={s.speaker} className="border-border/30 hover:border-primary/30 transition-all bg-card overflow-hidden group rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-14 w-14 border-4 border-background shadow-xl ring-2 ring-primary/5">
                          <img src={avatarFor(s.speaker)} className="object-cover" />
                          <AvatarFallback>{s.speaker[0]}</AvatarFallback>
                        </Avatar>
                        <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center shadow-sm border border-border/30">
                          <User className="h-3 w-3 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">{s.speaker}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{s.total_segments} contributions</p>
                      </div>
                    </div>
                    <div className="mt-6 flex h-2.5 w-full rounded-full overflow-hidden bg-muted/50 p-0.5 border border-border/20">
                      {Object.entries(s.emotion_distribution).map(([emo, pct]) => (
                        <div key={emo} className="h-full transition-all first:rounded-l-full last:rounded-r-full"
                          style={{ width: `${pct}%`, backgroundColor: EMOTION_COLORS[emo] }} title={`${emo}: ${pct}%`} />
                      ))}
                    </div>
                    <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                      <span className="text-muted-foreground">Top Sentiment</span>
                      <span className="text-primary">{Object.entries(s.emotion_distribution).sort((a: any, b: any) => b[1] - a[1])[0][0]}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              meetingsData?.map(m => {
                const meetingFlow = flow.filter(f => f.meeting_id === m._id);
                if (meetingFlow.length === 0) return null;
                const dist = meetingFlow.reduce((acc: any, cur) => { acc[cur.emotion] = (acc[cur.emotion] || 0) + 1; return acc; }, {});
                return (
                  <Card key={m._id} className="border-border/30 hover:border-primary/30 transition-all bg-card overflow-hidden group rounded-2xl shadow-sm hover:shadow-xl hover:-translate-y-1">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                          <TrendingUp className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-foreground truncate group-hover:text-primary">{m.analysis.meeting_name}</p>
                          <p className="text-[10px] font-bold opacity-50 uppercase tracking-widest">{meetingFlow.length} Segments</p>
                        </div>
                      </div>
                      <div className="mt-6 flex h-2 w-full rounded-full overflow-hidden bg-muted/50 p-0.5 border border-border/20">
                        {Object.entries(dist).map(([emo, count]) => {
                          const pct = ((count as number) / meetingFlow.length) * 100;
                          return (
                            <div key={emo} className="h-full" style={{ width: `${pct}%`, backgroundColor: EMOTION_COLORS[emo] }} />
                          );
                        })}
                      </div>
                      <div className="mt-4 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest">
                        <span className="text-muted-foreground">Condition</span>
                        <span className="text-primary font-mono">{Object.entries(dist).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'Neutral'}</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        {/* Inspector Side Panel (5 cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-8 animate-in slide-in-from-right-10 duration-700">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-serif text-2xl font-bold">Dialogue Explorer</h3>
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
            </div>

            {selectedSegment ? (
              <Card className="border-primary/20 bg-primary/5 shadow-2xl rounded-3xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-6">
                  <Sparkles className="h-8 w-8 text-primary opacity-10 animate-spin-slow" />
                </div>
                <CardContent className="p-8 space-y-8">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16 border-4 border-background shadow-2xl">
                      <img src={avatarFor(selectedSegment.speaker)} className="object-cover" />
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-xl font-bold text-foreground flex items-center gap-2">
                        {selectedSegment.speaker}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge style={{ backgroundColor: `${EMOTION_COLORS[selectedSegment.emotion]}20`, color: EMOTION_COLORS[selectedSegment.emotion] }}
                          className="text-[10px] font-bold uppercase tracking-widest border-none px-3 h-6">
                          {selectedSegment.emotion}
                        </Badge>
                        <span className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                          {(selectedSegment.confidence * 100).toFixed(0)}% Precise
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="relative">
                    <div className="p-8 rounded-3xl bg-background shadow-inner border border-border/40 text-foreground text-lg leading-relaxed font-serif italic">
                      <span className="absolute -top-4 -left-2 text-7xl text-primary/10 select-none font-serif">“</span>
                      {selectedSegment.text}
                      <span className="absolute -bottom-10 -right-2 text-7xl text-primary/10 select-none font-serif">”</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <Button asChild variant="link" className="text-xs font-bold uppercase tracking-widest text-primary p-0 h-auto group">
                      <Link href={`/app/transcripts?id=${selectedSegment.meeting_id}&segment=${selectedSegment.segment_id}`} className="flex items-center gap-2">
                        Jump to context <TrendingUp className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSegment(null)} className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 h-8 hover:bg-muted/50 rounded-lg">
                      Clear Inspector
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed border-border/40 bg-muted/10 backdrop-blur-sm rounded-3xl py-24 px-12 text-center group transition-all hover:bg-muted/20">
                <div className="flex flex-col items-center gap-6">
                  <div className="h-20 w-20 rounded-full bg-muted/40 border-4 border-background shadow-xl flex items-center justify-center relative">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/30 transition-transform group-hover:scale-110 duration-500" />
                    <div className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center animate-bounce">
                      <Sparkles className="h-3 w-3 text-primary" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-lg font-serif font-semibold text-foreground">Awaiting Discovery</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Select any node on the **Conversation Flow** timeline above to perform a granular deep-dive into the dialogue context and emotional subtext.
                    </p>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}