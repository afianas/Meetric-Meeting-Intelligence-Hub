"use client"

import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getSpeakerAnalytics } from "@/lib/api"
import { Sparkles, AlertCircle, Loader2, RefreshCw } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

const AVATAR_POOL = [
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=50&h=50&fit=crop&crop=face",
]
function avatarFor(name: string) {
  let h = 0; for (let i = 0; i < name.length; i++) h = (h + name.charCodeAt(i)) % AVATAR_POOL.length; return AVATAR_POOL[h]
}

interface SpeakerStat {
  speaker: string;
  total_segments: number;
  emotion_distribution: Record<string, number>;
}

function emotionBarColor(emotion: string): string {
  const e = (emotion || "").toLowerCase()
  if (e === "agreement") return "bg-green-500"
  if (e === "conflict") return "bg-red-500"
  if (e === "concern") return "bg-amber-500"
  if (e === "uncertainty") return "bg-purple-400"
  return "bg-gray-400"
}

export default function SpeakerSemanticsPage() {
  const { data: analytics, isLoading: loading, error, refetch: load } = useQuery({
    queryKey: ['analytics'],
    queryFn: getSpeakerAnalytics,
  })

  const speakers: SpeakerStat[] = analytics?.speakers || []

  const topEmotion = (dist: Record<string, number>): string => {
    const entries = Object.entries(dist)
    if (!entries.length) return "neutral"
    return entries.sort((a, b) => b[1] - a[1])[0][0]
  }

  const getTag = (emotion: string): { label: string; color: string } => {
    if (emotion === "agreement") return { label: "OPTIMISTIC", color: "text-green-600" }
    if (emotion === "conflict") return { label: "CRITICAL", color: "text-red-600" }
    if (emotion === "concern") return { label: "CONCERNED", color: "text-amber-600" }
    if (emotion === "neutral") return { label: "ANALYTICAL", color: "text-blue-600" }
    return { label: "BALANCED", color: "text-primary" }
  }

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-8 w-64 rounded bg-muted" />
      <div className="grid grid-cols-3 gap-4">{Array(3).fill(0).map((_,i) => <div key={i} className="h-40 rounded bg-muted" />)}</div>
    </div>
  )

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <AlertCircle className="h-10 w-10 text-red-400" />
      <p className="text-muted-foreground">{error instanceof Error ? error.message : String(error)}</p>
      <Button onClick={() => load()}>Retry</Button>
    </div>
  )

  if (speakers.length === 0) return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <h1 className="font-serif text-3xl font-semibold text-foreground">Speaker Analytics</h1>
        <Button variant="outline" className="gap-2" onClick={() => load()}><RefreshCw className="h-4 w-4" />Refresh</Button>
      </div>
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground/40 mb-4" />
          <h3 className="font-medium text-foreground">No speaker data yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload and process a meeting transcript to see speaker analytics.</p>
        </CardContent>
      </Card>
    </div>
  )

  // Aggregate sentiment across all speakers
  const allEmotions: Record<string, number> = {}
  for (const s of speakers) {
    for (const [e, pct] of Object.entries(s.emotion_distribution)) {
      allEmotions[e] = (allEmotions[e] || 0) + pct
    }
  }
  
  const aggAgreement = Math.round((allEmotions["agreement"] || 0) / speakers.length)
  const aggConflict = Math.round((allEmotions["conflict"] || 0) / speakers.length)
  const aggConcern = Math.round((allEmotions["concern"] || 0) / speakers.length)
  const aggNeutral = Math.round((allEmotions["neutral"] || 0) / speakers.length)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-foreground">Speaker Analytics</h1>
          <p className="mt-1 text-muted-foreground">Emotion distribution across {speakers.length} speaker{speakers.length !== 1 ? "s" : ""} from all indexed meetings.</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => load()}><RefreshCw className="h-4 w-4" />Refresh</Button>
      </div>

      {/* Aggregate Sentiment */}
      <Card>
        <CardContent className="p-6">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Aggregate Sentiment</p>
          <div className="mt-2 flex items-end gap-6 flex-wrap">
            <h2 className="font-serif text-4xl font-bold text-foreground">
              {aggAgreement >= 50 ? "Constructive" : aggConflict >= 25 ? "Tense" : "Balanced"}
            </h2>
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="flex items-center gap-1"><span className="font-semibold text-green-600">{aggAgreement}%</span><span className="text-muted-foreground">Agreement</span></span>
              <span className="flex items-center gap-1"><span className="font-semibold text-amber-600">{aggConcern}%</span><span className="text-muted-foreground">Concern</span></span>
              <span className="flex items-center gap-1"><span className="font-semibold text-red-600">{aggConflict}%</span><span className="text-muted-foreground">Conflict</span></span>
              <span className="flex items-center gap-1"><span className="font-semibold text-gray-600">{aggNeutral}%</span><span className="text-muted-foreground">Neutral</span></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs">
        {[["bg-green-500","Agreement"],["bg-amber-500","Concern"],["bg-purple-400","Uncertainty"],["bg-gray-400","Neutral"],["bg-red-500","Conflict"]].map(([cls,label])=>(
          <span key={label} className="flex items-center gap-1"><span className={`h-3 w-3 rounded-full ${cls}`}/>{label}</span>
        ))}
      </div>

      {/* Timeline per speaker */}
      <div>
        <h2 className="mb-4 font-serif text-xl font-semibold text-foreground">Speaker Sentiment Timeline</h2>
        <div className="space-y-4">
          {speakers.map(speaker => {
            const dist = speaker.emotion_distribution
            const emotions = [
              { key: "agreement", pct: dist.agreement || 0 },
              { key: "concern", pct: dist.concern || 0 },
              { key: "neutral", pct: dist.neutral || 0 },
              { key: "conflict", pct: dist.conflict || 0 },
              { key: "uncertainty", pct: dist.uncertainty || 0 },
            ].filter(e => e.pct > 0)
            return (
              <div key={speaker.speaker} className="flex items-center gap-4">
                <div className="flex w-44 items-center gap-3 flex-shrink-0">
                  <Avatar className="h-10 w-10">
                    <img src={avatarFor(speaker.speaker)} alt={speaker.speaker} className="rounded-full object-cover" />
                    <AvatarFallback>{speaker.speaker[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-foreground truncate max-w-[100px]">{speaker.speaker}</p>
                    <p className="text-xs text-muted-foreground">{speaker.total_segments} segments</p>
                  </div>
                </div>
                <div className="flex flex-1 gap-0.5 h-6 bg-muted/30 rounded-sm">
                  {emotions.map(e => (
                    <div key={e.key} className={`h-full rounded-sm transition-all ${emotionBarColor(e.key)}`} style={{ width: `${e.pct}%` }} title={`${e.key}: ${e.pct.toFixed(1)}%`} />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground w-12 text-right">{Math.round(dist.agreement || 0)}% agr</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Per-speaker details */}
      <div>
        <h2 className="mb-4 font-serif text-xl font-semibold text-foreground">Emotional Footprint</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {speakers.map(speaker => {
            const top = topEmotion(speaker.emotion_distribution)
            const tag = getTag(top)
            const dist = speaker.emotion_distribution
            return (
              <Card key={speaker.speaker}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <img src={avatarFor(speaker.speaker)} alt={speaker.speaker} className="rounded-full object-cover" />
                      <AvatarFallback>{speaker.speaker[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-foreground">{speaker.speaker}</p>
                      <p className={`text-xs font-medium ${tag.color}`}>{tag.label}</p>
                    </div>
                    <Sparkles className="ml-auto h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="mt-4 space-y-2">
                    {Object.entries(dist).sort((a,b) => b[1]-a[1]).filter(([,v]) => v > 0).map(([emotion, pct]) => (
                      <div key={emotion} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground capitalize">{emotion}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${emotionBarColor(emotion)}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-medium text-foreground w-10 text-right">{pct.toFixed(1)}%</span>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground pt-1">{speaker.total_segments} segments analyzed</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}