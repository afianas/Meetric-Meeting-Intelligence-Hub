"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getSpeakerAnalytics, getSentimentFlow, getSentimentInsight, getMeetings } from "@/lib/api"
import { Sparkles, RefreshCw, MessageSquare, User, TrendingUp, Info, Activity, Zap } from "lucide-react"
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
  agreement: "#15803d",
  conflict: "#b91c1c",
  concern: "#d97706",
  uncertainty: "#7c3aed",
  neutral: "#64748b"
}

export default function SpeakerIntelligencePage() {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("all")
  const [selectedSegment, setSelectedSegment] = useState<any>(null)

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

  // Dominant Tone Logic
  const dominantSentiment = useMemo(() => {
    if (flow.length === 0) return null;
    const counts: Record<string, number> = {};
    flow.forEach(f => { counts[f.emotion] = (counts[f.emotion] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }, [flow]);

  const dominantColor = useMemo(() => {
    return EMOTION_COLORS[dominantSentiment || "neutral"] || "#94a3b8";
  }, [dominantSentiment]);

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

  // Chronological Timeline Logic (Synchronized Grid)
  const speakerTimelines = useMemo(() => {
    const speakersList = Array.from(new Set(flow.map(f => f.speaker)));
    const timelines: Record<string, (any | null)[]> = {};
    speakersList.forEach(s => {
      timelines[s] = new Array(flow.length).fill(null);
    });
    flow.forEach((f, i) => {
      timelines[f.speaker][i] = f;
    });
    return timelines;
  }, [flow]);

  const isLoading = loadingStats || loadingFlow || loadingInsight

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
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
          Chronological sentiment mapping across your workspace dialogue.
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

      {/* Hero Split Section: Insight vs Dominant Tone */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-border/40 bg-background/40 backdrop-blur-md shadow-2xl overflow-hidden relative group rounded-3xl flex items-center">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,var(--color-primary),transparent)] opacity-10" />
            <CardContent className="p-8 md:p-10 relative w-full">
                <div className="space-y-6">
                    <div className="inline-flex py-1 px-3 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest border border-primary/20">
                        Executive Summary
                    </div>
                    <h2 className="text-xl md:text-2xl font-serif font-bold text-foreground leading-tight italic max-w-4xl">
                        "{insightData?.insight || "Generating psychological summary..."}"
                    </h2>
                </div>
            </CardContent>
        </Card>

        <Card className="lg:col-span-4 border-border/40 bg-background/40 backdrop-blur-md shadow-xl rounded-3xl overflow-hidden relative group flex flex-col items-center justify-center p-8 text-center transition-all hover:border-primary/20">
            <div className="absolute top-0 right-0 p-4">
                <Zap className="h-5 w-5 text-primary opacity-20" />
            </div>
            <div className="space-y-6 w-full">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
                    Dominant Tone
                </div>
                {dominantSentiment ? (
                    <div className="space-y-4">
                      <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full animate-ping opacity-20" style={{ backgroundColor: dominantColor }} />
                        <div className="relative h-20 w-20 rounded-full shadow-2xl flex items-center justify-center border-4 border-background" style={{ backgroundColor: dominantColor }}>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-2xl font-sans font-black uppercase tracking-widest" style={{ color: EMOTION_COLORS[dominantSentiment] }}>
                            {dominantSentiment}
                        </div>
                      </div>
                    </div>
                ) : (
                    <div className="h-20 w-20 rounded-full bg-muted/20 animate-pulse mx-auto" />
                )}
            </div>
        </Card>
      </div>

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
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area type="monotone" dataKey="val" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={0.05} fill="var(--color-primary)"
                    activeDot={{ r: 8, strokeWidth: 4, stroke: "var(--color-background)", fill: "var(--color-primary)" }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground italic">Analyze meetings to map flow dynamics.</div>
            )}
          </CardContent>
          <div className="p-4 pt-0 border-t border-border/30 bg-muted/20 flex justify-center backdrop-blur-md text-center">
            <p className="text-[10px] text-muted-foreground italic flex items-center gap-2 uppercase tracking-widest py-2">
              <Info className="h-3 w-3 text-primary opacity-50" /> Select nodes to perform granular dialogue inspection
            </p>
          </div>
        </Card>
      </div>

      {/* Speaker Sentiment Timeline (Synchronized Global Logic) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="font-serif text-2xl font-bold flex items-center gap-3">
             Sentiment Timeline
             <Badge variant="outline" className="text-[9px] border-primary/20 text-primary/60 font-bold tracking-widest uppercase">Chronological Grid</Badge>
          </h3>
          <div className="flex items-center gap-4 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
            <span>{flow.length} segments</span>
          </div>
        </div>
        
        <div className="space-y-4 px-2">
            {Object.entries(speakerTimelines).map(([speaker, slots]) => {
              const speakCount = slots.filter(s => s !== null).length;
              return (
                <div key={speaker} className="flex items-center gap-6">
                  <div className="w-32 shrink-0 flex items-center gap-2">
                    <Avatar className="h-5 w-5 border border-border/20 grayscale hover:grayscale-0 transition-all">
                      <img src={avatarFor(speaker)} />
                    </Avatar>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/70 truncate">{speaker}</span>
                  </div>
                  
                  {/* Dynamic Global Grid - No background track */}
                  <div className="flex-1 flex h-2 items-center relative">
                    {slots.map((seg, idx) => {
                      if (!seg) return <div key={idx} className="flex-1 h-px bg-border/10" />; // Invisible gap for alignment
                      
                      return (
                        <button
                          key={`${seg.segment_id}-${idx}`}
                          onClick={() => setSelectedSegment(seg)}
                          className={`flex-1 h-2 cursor-pointer hover:scale-y-[3] hover:brightness-110 transition-all relative group z-10`}
                          style={{ 
                            backgroundColor: EMOTION_COLORS[seg.emotion] || "#94a3b8",
                            opacity: selectedSegment?.segment_id === seg.segment_id ? 1 : 0.7
                          }}
                        >
                          <div className={`absolute -top-1 left-0 right-0 h-0.5 bg-primary transition-transform origin-left ${selectedSegment?.segment_id === seg.segment_id ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"}`} />
                        </button>
                      );
                    })}
                  </div>
                  <div className="w-24 text-right">
                    <span className="text-[9px] font-bold text-muted-foreground/30 uppercase tracking-widest">{speakCount} contribs</span>
                  </div>
                </div>
              );
            })}
        </div>
        
        <div className="flex justify-center gap-x-8 pt-4 border-t border-border/10">
          {Object.entries(EMOTION_COLORS).map(([emo, color]) => (
            <div key={emo} className="flex items-center gap-2 group cursor-default">
              <div className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[9px] font-sans font-bold uppercase tracking-widest text-muted-foreground/60 transition-colors group-hover:text-foreground" style={{ color }}>{emo}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive Detail Section: Explorer + Footprint Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 scroll-mt-24" id="dialogue-inspector">
        {/* Dialogue Explorer (Drill-down) */}
        <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between px-2">
                <h3 className="font-serif text-xl font-bold flex items-center gap-3">
                    Explorer 
                    {selectedSegment && <span className="text-[9px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 animate-pulse">Selected</span>}
                </h3>
                <div className="p-2 rounded-xl bg-primary/5 text-primary">
                    <MessageSquare className="h-4 w-4" />
                </div>
            </div>

            {selectedSegment ? (
            <Card className="border-primary/20 bg-primary/5 shadow-xl rounded-3xl overflow-hidden relative animate-in zoom-in-95 duration-500">
                <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-6">
                    <Avatar className="h-14 w-14 border-2 border-background shadow-lg ring-2 ring-primary/5 shrink-0">
                        <img src={avatarFor(selectedSegment.speaker)} className="object-cover" />
                    </Avatar>
                    <div className="space-y-1.5 flex-1 min-w-0">
                        <p className="text-xl font-serif font-black text-foreground truncate">
                            {selectedSegment.speaker}
                        </p>
                        <div className="flex items-center gap-3">
                            <Badge style={{ backgroundColor: `${EMOTION_COLORS[selectedSegment.emotion]}15`, color: EMOTION_COLORS[selectedSegment.emotion] }}
                                className="text-[10px] font-sans font-bold hover:bg-transparent uppercase tracking-widest border-none px-3 h-7 rounded-lg">
                                {selectedSegment.emotion}
                            </Badge>
                            <span className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                {(selectedSegment.confidence * 100).toFixed(0)}% Confidence
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button asChild variant="outline" size="sm" className="text-[8px] font-bold uppercase tracking-widest h-8 px-4 rounded-xl border-primary/10 hover:bg-primary/5">
                            <Link href={`/app/transcripts?id=${selectedSegment.meeting_id}&segment=${selectedSegment.segment_id}`} className="flex items-center gap-2">
                                <TrendingUp className="h-3 w-3" /> Source
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedSegment(null)} className="h-8 w-8 rounded-xl text-muted-foreground hover:bg-background/80 hover:text-primary">
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>

                <div className="relative">
                    <div className="p-6 rounded-2xl bg-background/60 shadow-inner border border-border/20 text-foreground text-lg leading-relaxed font-serif italic relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full bg-primary/20" />
                        <span className="absolute -top-4 -left-2 text-6xl text-primary/5 select-none font-serif italic">“</span>
                        {selectedSegment.text}
                    </div>
                </div>
                </CardContent>
            </Card>
            ) : (
            <Card className="border-dashed border-border/40 bg-muted/5 rounded-3xl py-12 px-6 text-center group transition-all hover:bg-muted/10">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-muted/20 border-2 border-background shadow-lg flex items-center justify-center relative rotate-2 group-hover:rotate-0 transition-transform duration-500">
                        <MessageSquare className="h-6 w-6 text-muted-foreground/20" />
                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center shadow-inner">
                            <Sparkles className="h-2 w-2 text-primary" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-lg font-serif font-black text-foreground/40">Select a segment above</p>
                        <p className="text-[9px] text-muted-foreground/60 leading-relaxed font-bold uppercase tracking-widest">
                            to reveal subtext and core quotes.
                        </p>
                    </div>
                </div>
            </Card>
            )}
        </div>

        {/* Detailed Emotional Footprint */}
        <div className="lg:col-span-5 space-y-4">
            <h3 className="font-serif text-xl font-bold px-2">Emotional Footprint</h3>
            <div className="space-y-4">
            {speakers.slice(0, 3).map(s => (
                <Card key={`footprint-${s.speaker}`} className="border-border/20 bg-card/20 backdrop-blur-md rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4 space-y-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border-2 border-background shadow-md grayscale hover:grayscale-0 transition-all">
                                <img src={avatarFor(s.speaker)} className="object-cover" />
                            </Avatar>
                            <div>
                                <p className="text-sm font-serif font-black text-foreground leading-none mb-1">{s.speaker}</p>
                                <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">Narrative Profile</p>
                            </div>
                            <div className="ml-auto text-[10px] font-serif font-black text-primary/5 italic select-none">
                                #{(speakers.indexOf(s) + 1).toString().padStart(2, '0')}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {Object.entries(s.emotion_distribution)
                            .sort((a: any, b: any) => b[1] - a[1])
                            .slice(0, 4)
                            .map(([emo, pct]) => (
                            <div key={emo} className="space-y-1">
                                <div className="flex items-center justify-between text-[9px] font-sans font-bold uppercase tracking-widest">
                                    <span style={{ color: EMOTION_COLORS[emo] }}>{emo}</span>
                                    <span className="text-primary/70">{pct}%</span>
                                </div>
                                <div className="h-1 w-full rounded-full bg-muted/20 overflow-hidden shadow-inner">
                                    <div 
                                        className="h-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${pct}%`, backgroundColor: EMOTION_COLORS[emo] }} 
                                    />
                                </div>
                            </div>
                        ))}
                        </div>
                    </CardContent>
                </Card>
            ))}
            </div>
        </div>
      </div>
    </div>
  )
}