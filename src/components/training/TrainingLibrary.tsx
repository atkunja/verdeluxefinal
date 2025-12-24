import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";

export function TrainingLibrary() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: videos, isLoading, isError } = useQuery(trpc.training.getTrainingVideos.queryOptions());
  const [newVideo, setNewVideo] = useState({ title: "", url: "" });

  const createVideo = useMutation(
    trpc.training.createTrainingVideo.mutationOptions({
      onSuccess: () => {
        toast.success("Video added");
        setNewVideo({ title: "", url: "" });
        queryClient.invalidateQueries({ queryKey: trpc.training.getTrainingVideos.queryKey() });
      },
      onError: (err: any) => toast.error(err?.message || "Failed to add video"),
    })
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Failed to load training videos</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-primary uppercase">Training</p>
        <h3 className="text-lg font-bold text-gray-900">Training Library</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Title"
            value={newVideo.title}
            onChange={(e) => setNewVideo({ ...newVideo, title: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Video URL"
            value={newVideo.url}
            onChange={(e) => setNewVideo({ ...newVideo, url: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <button
            onClick={() => createVideo.mutate(newVideo as any)}
            disabled={createVideo.isPending}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60"
          >
            Add Video
          </button>
        </div>

        <ul className="divide-y divide-gray-100">
          {videos?.map((video: any) => (
            <li key={video.id} className="py-2">
              <p className="font-semibold text-sm text-gray-900">{video.title}</p>
              {video.url && (
                <a href={video.url} target="_blank" rel="noreferrer" className="text-xs text-primary">
                  Watch
                </a>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
