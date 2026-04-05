"use client"

import { useState, useMemo } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getSpeakerAnalytics, getSentimentFlow, getSentimentInsight, getMeetings } from "@/lib/api"
import { RefreshCw } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { ChartFlowSegment, FlowSegment, Meeting, AnalyticsResponse, FlowResponse, InsightResponse } from "./types"
import { getEmotionWeight } from "./constants"

import { HeroSplit } from "./components/HeroSplit"
import { CollaboratorRadar } from "./components/CollaboratorRadar"
import { ConversationFlow } from "./components/ConversationFlow"
import { SynchronizedTimeline } from "./components/SynchronizedTimeline"
import { DialogueExplorer } from "./components/DialogueExplorer"
import { EmotionalFootprint } from "./components/EmotionalFootprint"

export default function SpeakerIntelligencePage() {
  const [selectedMeetingId, setSelectedMeetingId] = useState<string>("all")
  const [selectedSegment, setSelectedSegment] = useState<FlowSegment | null>(null)

  // Data Fetching
  const { data: meetingsData } = useQuery<Meeting[]>({ 
    queryKey: ["meetings"], 
    queryFn: getMeetings 
  })
  
  const { data: analytics, isLoading: loadingStats, refetch: refetchStats } = useQuery<AnalyticsResponse>({
    queryKey: ["analytics", selectedMeetingId],
    queryFn: () => getSpeakerAnalytics(selectedMeetingId === "all" ? undefined : selectedMeetingId),
  })
  
  const { data: flowData, isLoading: loadingFlow } = useQuery<FlowResponse>({
    queryKey: ["flow", selectedMeetingId],
    queryFn: () => getSentimentFlow(selectedMeetingId === "all" ? undefined : selectedMeetingId),
  })
  
  const { data: insightData, isLoading: loadingInsight } = useQuery<InsightResponse>({
    queryKey: ["insight", selectedMeetingId],
    queryFn: () => getSentimentInsight(selectedMeetingId === "all" ? undefined : selectedMeetingId),
  })

  // Derived Datasets via Memoization
  const speakers = useMemo(() => analytics?.speakers || [], [analytics])
  const topCollaborators = useMemo(() => speakers.slice(0, 3), [speakers])
  const flow = useMemo(() => flowData?.flow || [], [flowData])

  const dominantSentiment = useMemo(() => {
    if (flow.length === 0) return null;
    const counts: Record<string, number> = {};
    for (const f of flow) {
      if (f.emotion) counts[f.emotion] = (counts[f.emotion] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : null;
  }, [flow]);

  const chartFlow = useMemo<ChartFlowSegment[]>(() => {
    return flow.map((s, index) => ({
      ...s,
      index,
      val: getEmotionWeight(s.emotion)
    }));
  }, [flow]);

  const isLoading = loadingStats || loadingFlow || loadingInsight

  return (
    <div className="space-y-12 animate-in fade-in duration-700 pb-20">
      {/* Editorial Header */}
      <div className="text-center space-y-4 max-w-3xl mx-auto pt-6">
        <h1 className="font-serif text-5xl tracking-tight text-foreground leading-tight">
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
                <SelectItem key={m._id} value={m._id} className="text-sm">
                  {m.analysis?.meeting_name || "Unknown Meeting"}
                </SelectItem>
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

      <HeroSplit insightData={insightData} dominantSentiment={dominantSentiment} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        <CollaboratorRadar speakers={topCollaborators} />
        <ConversationFlow chartFlow={chartFlow} setSelectedSegment={setSelectedSegment} />
      </div>

      <SynchronizedTimeline 
        flow={flow} 
        selectedSegment={selectedSegment} 
        setSelectedSegment={setSelectedSegment} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 scroll-mt-24" id="dialogue-inspector">
        <DialogueExplorer selectedSegment={selectedSegment} setSelectedSegment={setSelectedSegment} />
        <EmotionalFootprint speakers={speakers} />
      </div>
    </div>
  )
}