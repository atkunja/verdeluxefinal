import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

export function CleanerProgressDashboard({ cleanerId }) {
  // This is a placeholder. A real implementation would fetch and display the cleaner's training progress.
  const trpc = useTRPC();
  const { data: progress, isLoading, isError } = useQuery(
    trpc.training.getTrainingProgress.queryOptions({ cleanerId })
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Failed to load progress</div>;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-xs font-semibold text-primary uppercase">Training</p>
          <h3 className="text-lg font-bold text-gray-900">Cleaner Training Progress</h3>
        </div>
      </div>
      <div className="space-y-2">
        {progress?.map((p: any) => (
          <div key={p.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50">
            <p className="font-semibold text-sm text-gray-900">{p.trainingVideoTitle || "Training"}</p>
            <p className="text-xs text-gray-600">Status: {p.status ?? "in-progress"}</p>
            {p.score !== undefined && <p className="text-xs text-gray-600">Score: {p.score}</p>}
          </div>
        ))}
        {(!progress || progress.length === 0) && (
          <p className="text-sm text-gray-600">No progress recorded yet.</p>
        )}
      </div>
    </div>
  );
}
