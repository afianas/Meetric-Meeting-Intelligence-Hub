import { Card, CardContent } from "@/components/ui/card"
import { Zap } from "lucide-react"
import { InsightResponse } from "../types"
import { getEmotionColor } from "../constants"

interface HeroSplitProps {
  insightData?: InsightResponse | null;
  dominantSentiment: string | null;
}

export function HeroSplit({ insightData, dominantSentiment }: HeroSplitProps) {
  const dominantColor = getEmotionColor(dominantSentiment || undefined);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <Card className="lg:col-span-8 border-border/40 bg-background/40 backdrop-blur-md shadow-sm overflow-hidden relative group rounded-3xl flex items-center">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,var(--color-primary),transparent)] opacity-10" />
        <CardContent className="p-8 md:p-10 relative w-full">
          <div className="space-y-6">
            <div className="inline-flex py-1 px-3 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-widest border border-primary/20">
              Executive Summary
            </div>
            <h2 className="text-xl md:text-2xl font-serif text-foreground leading-tight italic max-w-4xl">
              &quot;{insightData?.insight || "Generating psychological summary..."}&quot;
            </h2>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-4 border-border/40 bg-background/40 backdrop-blur-md shadow-sm rounded-3xl overflow-hidden relative group flex flex-col items-center justify-center p-8 text-center transition-all hover:border-primary/20">
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
                <div className="text-2xl font-sans font-black uppercase tracking-widest" style={{ color: dominantColor }}>
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
  )
}
