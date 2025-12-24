import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, MessageSquare, Trash2, Globe, Lock, Clock } from "lucide-react";
import toast from "react-hot-toast";

export const Route = createFileRoute("/admin-portal/reviews")({
    component: ReviewsPage,
});

function ReviewsPage() {
    const trpc = useTRPC();
    const reviewsQuery = useQuery(trpc.reviews.getReviewsAdmin.queryOptions());
    const reviews = (reviewsQuery.data as any[]) || [];

    const updateMutation = useMutation(trpc.reviews.updateReviewAdmin.mutationOptions({
        onSuccess: () => {
            toast.success("Review updated");
            reviewsQuery.refetch();
        }
    }));

    const deleteMutation = useMutation(trpc.reviews.deleteReviewAdmin.mutationOptions({
        onSuccess: () => {
            toast.success("Review deleted");
            reviewsQuery.refetch();
        }
    }));

    const handleTogglePublic = async (id: number, current: boolean) => {
        try {
            await (updateMutation as any).mutateAsync({ id, isPublic: !current });
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("Delete this review?")) return;
        try {
            await (deleteMutation as any).mutateAsync({ id });
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    return (
        <AdminShell
            title="User Reviews"
            subtitle="Manage client feedback and visibility."
        >
            <div className="grid gap-6">
                {reviews.map((review) => (
                    <div key={review.id} className="group relative rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="font-bold text-[#0f172a]">
                                        {review.booking.client.firstName} {review.booking.client.lastName}
                                    </span>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Clock className="h-3.5 w-3.5" />
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleTogglePublic(review.id, review.isPublic)}
                                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${review.isPublic
                                        ? "bg-green-50 text-green-700 border border-green-100 hover:bg-green-100"
                                        : "bg-gray-50 text-gray-500 border border-gray-100 hover:bg-gray-100"
                                        }`}
                                >
                                    {review.isPublic ? <Globe className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                                    {review.isPublic ? "Public" : "Private"}
                                </button>
                                <button
                                    onClick={() => handleDelete(review.id)}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-0.5 mb-3">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    className={`h-4 w-4 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
                                />
                            ))}
                        </div>

                        <p className="text-gray-700 text-sm leading-relaxed mb-4">
                            "{review.comment || "No comment provided."}"
                        </p>

                        <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-400">
                                Booking ID: #{review.bookingId} • Service: {review.booking.serviceType}
                            </span>
                            <div className="flex items-center gap-2">
                                <MessageSquare className="h-3.5 w-3.5 text-primary/40" />
                                <span className="text-[10px] uppercase font-bold tracking-widest text-primary/40">Verified Booking</span>
                            </div>
                        </div>
                    </div>
                ))}

                {reviewsQuery.isLoading && (
                    <div className="py-20 text-center text-gray-400 italic">
                        Gathering feedback...
                    </div>
                )}

                {!reviewsQuery.isLoading && reviews.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center p-10">
                        <div className="mb-4 rounded-full bg-white p-4 shadow-sm">
                            <Star className="h-8 w-8 text-gray-200" />
                        </div>
                        <h3 className="text-lg font-bold text-[#0f172a]">No Reviews Yet</h3>
                        <p className="text-sm text-gray-500 max-w-xs mt-1">
                            Client reviews will appear here once they start submitting feedback after their appointments.
                        </p>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
