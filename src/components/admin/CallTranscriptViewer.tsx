import { useState } from "react";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Brain, FileText, Loader2, Sparkles } from "lucide-react";

interface CallTranscriptViewerProps {
  callId: number;
}

export function CallTranscriptViewer({ callId }: CallTranscriptViewerProps) {
  const trpc = useTRPC();
  const [analysis, setAnalysis] = useState<{
    sentiment: "positive" | "neutral" | "negative";
    actionItems: string[];
    summary: string;
  } | null>(null);

  const transcriptQuery = useQuery(trpc.ai.getTranscript.queryOptions({ callId }));
  const analyzeMutation = useMutation(trpc.ai.analyzeCallTranscript.mutationOptions({
    onSuccess: (data: any) => setAnalysis(data),
  }));

  if (transcriptQuery.isLoading) {
    return (
      <div className="flex items-center justify-center p-8 bg-gray-50 rounded-xl border border-gray-100 italic text-gray-400">
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
        Loading transcript...
      </div>
    );
  }

  const transcript = transcriptQuery.data;

  if (!transcript) {
    return (
      <div className="p-8 bg-gray-50 rounded-xl border border-gray-100 text-center italic text-gray-400">
        No transcript available for this call.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-gray-900 font-semibold text-lg">
          <FileText className="w-5 h-5 text-primary" />
          Call Transcript
        </div>
        {!analysis && !analyzeMutation.isPending && (
          <button
            onClick={() => analyzeMutation.mutate({ transcript: transcript.transcript })}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-dark transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Sparkles className="w-4 h-4" />
            Analyze with AI
          </button>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-200 max-h-[400px] overflow-y-auto shadow-sm">
        <div className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed font-serif">
          {transcript.transcript}
        </div>
      </div>

      {analyzeMutation.isPending && (
        <div className="flex items-center justify-center p-10 bg-primary/5 rounded-2xl border border-primary/10 border-dashed animate-pulse">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Brain className="w-12 h-12 text-primary" />
              <div className="absolute -top-1 -right-1">
                <Sparkles className="w-4 h-4 text-primary animate-spin" />
              </div>
            </div>
            <p className="text-primary font-bold text-sm">AI is deriving insights from the conversation...</p>
          </div>
        </div>
      )}

      {analysis && (
        <div className="bg-gradient-to-br from-[#f8fafc] via-white to-[#f1f5f9] p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Brain className="w-32 h-32 text-primary" />
          </div>

          <div className="flex items-center gap-3 text-slate-800 font-black text-xl tracking-tight">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            AI Insights
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-3">Overall Sentiment</div>
              <div className={`inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold capitalize shadow-sm border
                ${analysis.sentiment === 'positive' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                  analysis.sentiment === 'negative' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                    'bg-slate-100 text-slate-700 border-slate-200'}`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${analysis.sentiment === 'positive' ? 'bg-emerald-500' :
                  analysis.sentiment === 'negative' ? 'bg-rose-500' : 'bg-slate-400'
                  }`} />
                {analysis.sentiment}
              </div>
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-3">Conversation Summary</div>
            <p className="text-base text-slate-600 leading-relaxed font-medium bg-white/50 p-4 rounded-2xl border border-white/80">
              "{analysis.summary}"
            </p>
          </div>

          {analysis.actionItems.length > 0 && (
            <div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-black mb-4">Recommended Actions</div>
              <div className="grid gap-3">
                {analysis.actionItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-4 bg-white/80 hover:bg-white p-4 rounded-2xl border border-slate-100 transition-all hover:shadow-md group">
                    <span className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-xl flex items-center justify-center text-xs font-black group-hover:bg-primary group-hover:text-white transition-colors">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="text-sm text-slate-700 font-semibold">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

