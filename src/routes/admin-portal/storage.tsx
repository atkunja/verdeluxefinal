import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AdminShell } from "~/components/admin/AdminShell";
import { ImageIcon, Search, Trash2, ExternalLink, Calendar, User, HardDrive, Images, Camera } from "lucide-react";

export const Route = createFileRoute("/admin-portal/storage")({
    component: StoragePage,
});

function StoragePage() {
    const trpc = useTRPC();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState<"ALL" | "BEFORE" | "AFTER" | "DURING">("ALL");

    const imagesQuery = useQuery({
        queryKey: ["admin", "all-images"],
        queryFn: async () => {
            return [
                { id: 1, url: "https://images.unsplash.com/photo-1581578731548-c64695ce6958?auto=format&fit=crop&q=80&w=400", type: "BEFORE", bookingId: 101, customer: "John Doe", date: new Date() },
                { id: 2, url: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=400", type: "AFTER", bookingId: 101, customer: "John Doe", date: new Date() },
                { id: 3, url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400", type: "DURING", bookingId: 102, customer: "Jane Smith", date: new Date() },
            ];
        }
    });

    const images = imagesQuery.data || [];

    const filteredImages = images.filter(img => {
        if (filter !== "ALL" && img.type !== filter) return false;
        if (search) {
            const term = search.toLowerCase();
            return img.customer.toLowerCase().includes(term) || img.bookingId.toString().includes(term);
        }
        return true;
    });

    // Stats
    const beforeCount = images.filter(i => i.type === "BEFORE").length;
    const afterCount = images.filter(i => i.type === "AFTER").length;
    const duringCount = images.filter(i => i.type === "DURING").length;

    return (
        <AdminShell
            title="Photo Storage"
            subtitle="Manage booking photos and documentation"
        >
            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</p>
                            <p className="text-2xl font-black text-slate-900 mt-1">{images.length}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center">
                            <HardDrive className="h-5 w-5 text-slate-500" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Before</p>
                            <p className="text-2xl font-black text-blue-600 mt-1">{beforeCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                            <Camera className="h-5 w-5 text-blue-500" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">After</p>
                            <p className="text-2xl font-black text-emerald-600 mt-1">{afterCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                            <Images className="h-5 w-5 text-emerald-500" />
                        </div>
                    </div>
                </div>
                <div className="premium-card !p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">During</p>
                            <p className="text-2xl font-black text-amber-600 mt-1">{duringCount}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <ImageIcon className="h-5 w-5 text-amber-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="premium-card !p-4 mb-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-50 border border-slate-100 focus-within:border-[#163022] focus-within:bg-white transition-all">
                            <Search className="h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search customer or booking..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-48 bg-transparent text-sm font-medium focus:outline-none placeholder:text-slate-400"
                            />
                        </div>
                        <div className="flex gap-1 p-1 bg-slate-50 rounded-xl">
                            {(["ALL", "BEFORE", "AFTER", "DURING"] as const).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${filter === f
                                            ? "bg-[#163022] text-white"
                                            : "text-slate-400 hover:text-slate-600"
                                        }`}
                                >
                                    {f === "ALL" ? "All" : f}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="text-xs font-bold text-slate-400">
                        {filteredImages.length} photos
                    </div>
                </div>
            </div>

            {/* Image Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredImages.map((img) => (
                    <div key={img.id} className="premium-card !p-0 overflow-hidden group">
                        <div className="relative aspect-square overflow-hidden">
                            <img
                                src={img.url}
                                alt={`Booking ${img.bookingId}`}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            <div className="absolute top-3 right-3 flex gap-2 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <button className="h-8 w-8 bg-white/90 backdrop-blur rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:text-rose-500 transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <a
                                    href={img.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="h-8 w-8 bg-white/90 backdrop-blur rounded-lg shadow-lg flex items-center justify-center text-slate-600 hover:text-[#163022] transition-colors"
                                >
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                            <div className="absolute bottom-3 left-3">
                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest backdrop-blur ${img.type === "BEFORE" ? "bg-blue-500/80 text-white" :
                                        img.type === "AFTER" ? "bg-emerald-500/80 text-white" :
                                            "bg-amber-500/80 text-white"
                                    }`}>
                                    {img.type}
                                </span>
                            </div>
                        </div>

                        <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-bold text-slate-900 text-sm">Booking #{img.bookingId}</h4>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                                        <User className="w-3.5 h-3.5" />
                                        {img.customer}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 pt-3 border-t border-slate-50">
                                <Calendar className="w-3.5 h-3.5" />
                                {img.date.toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredImages.length === 0 && (
                <div className="py-20 text-center">
                    <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
                        <ImageIcon className="h-10 w-10 text-slate-300" />
                    </div>
                    <h3 className="text-xl font-extrabold text-slate-900 mb-2">No photos found</h3>
                    <p className="text-slate-400 max-w-sm mx-auto">
                        Try adjusting your search or filters to find what you're looking for.
                    </p>
                </div>
            )}
        </AdminShell>
    );
}
