import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TrendingUp, Info } from "lucide-react"
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartFlowSegment, FlowSegment, ChartClickEvent } from "../types"
import { EMOTIONS, getEmotionBg, getEmotionColor } from "../constants"
import { getInitials } from "@/lib/api"

interface ConversationFlowProps {
  chartFlow: ChartFlowSegment[];
  setSelectedSegment: (segment: FlowSegment | null) => void;
}

export function ConversationFlow({ chartFlow, setSelectedSegment }: ConversationFlowProps) {
  return (
    <Card className="lg:col-span-3 border-border/40 shadow-sm rounded-3xl bg-background/40 backdrop-blur-sm overflow-hidden flex flex-col">
      <CardHeader className="p-8 pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Conversation Flow Dynamics
          </CardTitle>
          <div className="flex gap-2">
            {EMOTIONS.slice(0, 2).map((emo) => (
              <Badge key={emo} variant="outline"
                className="text-[9px] font-sans font-bold uppercase tracking-widest border-none px-2 h-5 rounded-md"
                style={{ backgroundColor: getEmotionBg(emo, 0.15), color: getEmotionColor(emo) }}>
                {emo}
              </Badge>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0 mt-8 min-h-[320px]">
        {chartFlow.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartFlow} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
              onClick={(e: unknown) => {
                const ev = e as ChartClickEvent;
                if (ev?.activePayload?.[0]) {
                  setSelectedSegment(ev.activePayload[0].payload);
                }
              }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="index" hide />
              <YAxis hide domain={[-15, 15]} />
              <Tooltip
                cursor={{ stroke: 'var(--color-primary)', strokeWidth: 1.5, strokeDasharray: '4 4' }}
                content={({ active, payload }) => {
                  if (active && payload?.[0]) {
                    const d: ChartFlowSegment = payload[0].payload as ChartFlowSegment;
                    return (
                      <div className="bg-background/95 backdrop-blur-xl border border-border/40 p-4 rounded-xl shadow-lg max-w-[280px]">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-6 w-6 border border-border/40 bg-muted">
                            <AvatarFallback className="text-[10px] font-bold text-muted-foreground">{getInitials(d.speaker)}</AvatarFallback>
                          </Avatar>
                          <span className="text-[10px] font-bold text-foreground truncate">{d.speaker}</span>
                          <Badge
                            style={{ backgroundColor: getEmotionBg(d.emotion, 0.15), color: getEmotionColor(d.emotion) }}
                            className="ml-auto text-[8px] border-none font-sans font-bold uppercase tracking-widest px-2 h-5 rounded-md"
                          >
                            {d.emotion}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed font-medium italic">&quot;{d.text}&quot;</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area type="monotone" dataKey="val" stroke="var(--color-primary)" strokeWidth={3} fillOpacity={0.05} fill="var(--color-primary)"
                activeDot={{ r: 8, strokeWidth: 4, stroke: "white", fill: "var(--color-primary)" }} />
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
  )
}
