import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { User } from "lucide-react"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip } from "recharts"
import { Speaker } from "../types"
import { EMOTIONS } from "../constants"
import { useMemo } from "react"

interface CollaboratorRadarProps {
  speakers: Speaker[];
}

export function CollaboratorRadar({ speakers }: CollaboratorRadarProps) {
  const radarData = useMemo(() => {
    return EMOTIONS.map(emotion => {
      const entry: Record<string, string | number> = { emotion: emotion.toUpperCase() }
      speakers.slice(0, 3).forEach(s => { 
        entry[s.speaker] = s.emotion_distribution[emotion] || 0 
      })
      return entry
    })
  }, [speakers])

  return (
    <Card className="lg:col-span-2 border-border/40 shadow-sm transition-all hover:border-primary/10 rounded-3xl bg-background/40 backdrop-blur-sm">
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
  )
}
