import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AdminShell } from "~/components/admin/AdminShell";
import { ImageIcon, Search, Filter, Trash2, ExternalLink, Calendar, User } from "lucide-react";

export const Route = createFileRoute("/admin-portal/storage")({
    component: StoragePage,
});

function StoragePage() {
    const trpc = useTRPC();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"ALL" | "BEFORE" | "AFTER" | "DURING">("ALL");

    // Note: We'd ideally have a getAllBookingImages query. 
    // For now, let's assume we can fetch recent ones or we have a procedure for it.
    // Since I don't see a getAllBookingImages, I'll use a placeholder or assume it exists in the future.
    // Actually, I'll implement a stubbed view if the procedure doesn't exist yet.

    const imagesQuery = useQuery({
        queryKey: ["admin", "all-images"],
        queryFn: async () => {
            // Stubbing for now as we don't have a listAllImages procedure yet
            return [
                { id: 1, url: "https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&q=80&w=400", type: "BEFORE", bookingId: 101, customer: "John Doe", date: new Date() },
                { id: 2, url: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=400", type: "AFTER", bookingId: 101, customer: "John Doe", date: new Date() },
                { id: 3, url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400", type: "DURING", bookingId: 102, customer: "Jane Smith", date: new Date() },
            ];
        }
    });

    const images = imagesQuery.data || [];

    return (
        <AdminShell
            title="Storage"
            subtitle="Manage and review all booking photos."
        >
            <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3 flex-1 min-w-[300px]">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search by customer or booking ID..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                            />
                        </div>
                        <select
                            value={filter}
                            onChange={(e) => setFilter(e.target.value as any)}
                            className="px-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white"
                        >
                            <option value="ALL">All Types</option>
                            <option value="BEFORE">Before</option>
                            <option value="AFTER">After</option>
                            <option value="DURING">During</option>
                        </select>
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                        Total: {images.length} photos
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {images.map((img) => (
                        <div key={img.id} className="group bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300">
                            <div className="relative aspect-square overflow-hidden">
                                <img
                                    src={img.url}
                                    alt={`Booking ${img.bookingId}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                                <div className="absolute top-3 right-3 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    <button className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg text-gray-700 hover:text-red-500 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <a
                                        href={img.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-white/90 backdrop-blur rounded-lg shadow-lg text-gray-700 hover:text-primary transition-colors"
                                    >
                                        <ExternalLink className="w-4 h-4" />
                                    </a>
                                </div>
                                <div className="absolute bottom-3 left-3">
                                    <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider backdrop-blur bg-black/40 text-white`}>
                                        {img.type}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h4 className="font-bold text-gray-900 text-sm">Booking #{img.bookingId}</h4>
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                            <User className="w-3.5 h-3.5" />
                                            {img.customer}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-gray-400 pt-2 border-t border-gray-50">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {img.date.toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {images.length === 0 && (
                    <div className="py-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                            <ImageIcon className="w-10 h-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">No photos found</h3>
                        <p className="text-gray-500 text-sm max-w-xs mx-auto mt-1">
                            Try adjusting your search or filters to find what you're looking for.
                        </p>
                    </div>
                )}
            </div>
        </AdminShell>
    );
}
