import { createFileRoute } from "@tanstack/react-router";
import { AdminShell } from "~/components/admin/AdminShell";
import { useTRPC } from "~/trpc/react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Star, MessageSquare, Trash2, Globe, Lock, Clock, TrendingUp, Users, Award } from "lucide-react";
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

    // Stats
    const avgRating = reviews.length > 0
        ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0";
    const publicCount = reviews.filter(r => r.isPublic).length;
    const fiveStarCount = reviews.filter(r => r.rating === 5).length;

    return (
        <AdminShell
            title="Customer Reviews"
            subtitle="Manage client feedback and testimonials"
        >
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Reviews</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{reviews.length}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-slate-400" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Avg Rating</p>
                            <p className="text-2xl font-black text-amber-500 mt-1 flex items-center gap-1">
                                {avgRating}
                                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                            </p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-amber-500" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Public</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1">{publicCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Globe className="h-5 w-5 text-emerald-500" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">5-Star</p>
                            <p className="text-2xl font-black text-[#163022] mt-1">{fiveStarCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-[#163022]/10 flex items-center justify-center">
                            <Award className="h-5 w-5 text-[#163022]" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Reviews Grid */}
            <div className="grid gap-5 md:grid-cols-2">
                {reviews.map((review) => (
                    <div key={review.id} className="premium-card group">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[#163022] to-[#264e3c] text-white flex items-center justify-center font-bold text-sm">
                                    {review.booking.client.firstName?.[0]}{review.booking.client.lastName?.[0]}
                                </div>
                                <div>
                                    <span className="font-bold text-slate-900">
                                        {review.booking.client.firstName} {review.booking.client.lastName}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                        <Clock className="h-3 w-3" />
                                        {new Date(review.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleTogglePublic(review.id, review.isPublic)}
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all ${review.isPublic
                                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                        }`}
                                >
                                    {review.isPublic ? <Globe className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                                    {review.isPublic ? "Public" : "Hidden"}
                                </button>
                                <button
                                    onClick={() => handleDelete(review.id)}
                                    className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-0.5 mb-3">
                            {[1, 2, 3, 4, 5].map((s) => (
                                <Star
                                    key={s}
                                    className={`h-4 w-4 ${s <= review.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                                />
                            ))}
                            <span className="ml-2 text-xs font-bold text-slate-400">{review.rating}.0</span>
                        </div>

                        <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3">
                            "{review.comment || "No comment provided."}"
                        </p>

                        <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                            <span className="text-[10px] font-medium text-slate-400">
                                Booking #{review.bookingId} • {review.booking.serviceType}
                            </span>
                            <div className="flex items-center gap-1.5">
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                <span className="text-[9px] uppercase font-black tracking-widest text-emerald-500">Verified</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {reviewsQuery.isLoading && (
                <div className="py-20 text-center">
                    <div className="h-8 w-8 border-2 border-slate-200 border-t-[#163022] rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-slate-400">Loading reviews...</p>
                </div>
            )}

            {!reviewsQuery.isLoading && reviews.length === 0 && (
                <div className="py-20 text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                        <Star className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-2">No Reviews Yet</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">
                        Customer reviews will appear here once they submit feedback after their appointments.
                    </p>
                </div>
            )}
        </AdminShell>
    );
}
