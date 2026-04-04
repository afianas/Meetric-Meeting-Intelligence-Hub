export interface EmotionDistribution {
  agreement?: number;
  concern?: number;
  conflict?: number;
  uncertainty?: number;
  neutral?: number;
  [key: string]: number | undefined;
}

export interface Speaker {
  speaker: string;
  emotion_distribution: EmotionDistribution;
}

export interface FlowSegment {
  speaker: string;
  emotion: string;
  text: string;
  meeting_id: string;
  segment_id: string;
}

export interface ChartFlowSegment extends FlowSegment {
  index: number;
  val: number;
}

export interface MeetingAnalysis {
  meeting_name: string;
}

export interface Meeting {
  _id: string;
  analysis: MeetingAnalysis;
}

export interface AnalyticsResponse {
  speakers: Speaker[];
}

export interface FlowResponse {
  flow: FlowSegment[];
}

export interface InsightResponse {
  insight: string;
}
