import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Speaker } from "../types"
import { getEmotionColor } from "../constants"
import { getInitials } from "@/lib/api"

interface EmotionalFootprintProps {
  speakers: Speaker[];
}

export function EmotionalFootprint({ speakers }: EmotionalFootprintProps) {
  return (
    <div className="lg:col-span-5 space-y-4">
      <h3 className="font-serif text-xl px-2">Emotional Footprint</h3>
      <div className="space-y-4">
        {speakers.slice(0, 3).map((s, index) => (
          <Card key={`footprint-${s.speaker}`} className="border-border/30 bg-card/10 backdrop-blur-md rounded-2xl overflow-hidden shadow-none hover:shadow-sm transition-all hover:border-border/50">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-background shadow-md bg-muted">
                  <AvatarFallback className="font-bold text-muted-foreground">{getInitials(s.speaker)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-serif font-black text-foreground leading-none mb-1">{s.speaker}</p>
                  <p className="text-[9px] font-bold text-primary/40 uppercase tracking-widest">Narrative Profile</p>
                </div>
                <div className="ml-auto text-[10px] font-serif font-black text-primary/5 italic select-none">
                  #{(index + 1).toString().padStart(2, '0')}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {Object.entries(s.emotion_distribution)
                  .sort((a, b) => (b[1] || 0) - (a[1] || 0))
                  .slice(0, 4)
                  .map(([emo, pct]) => {
                    const color = getEmotionColor(emo);
                    return (
                      <div key={emo} className="space-y-1">
                        <div className="flex items-center justify-between text-[9px] font-sans font-bold uppercase tracking-widest">
                          <span style={{ color }}>{emo}</span>
                          <span className="text-primary/70">{pct}%</span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-muted/20 overflow-hidden shadow-inner">
                          <div
                            className="h-full transition-all duration-1000 ease-out"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
