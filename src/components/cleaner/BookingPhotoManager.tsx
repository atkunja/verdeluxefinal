import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { Camera, Image as ImageIcon, CheckCircle2, X, Loader2, UploadCloud } from "lucide-react";
import toast from "react-hot-toast";

interface BookingPhotoManagerProps {
    bookingId: number;
    uploaderId: number;
}

export function BookingPhotoManager({ bookingId, uploaderId }: BookingPhotoManagerProps) {
    const trpc = useTRPC();
    const queryClient = useQueryClient();
    const [uploadingType, setUploadingType] = useState<"BEFORE" | "AFTER" | "DURING" | null>(null);

    const imagesQuery = useQuery(trpc.photos.getBookingImages.queryOptions({ bookingId }));

    const createSignedUpload = useMutation(trpc.photos.createSignedUpload.mutationOptions());
    const savePhotoRecord = useMutation(trpc.photos.savePhotoRecord.mutationOptions());

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "BEFORE" | "AFTER" | "DURING") => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploadingType(type);
        const fileList = Array.from(files);

        for (const file of fileList) {
            try {
                const signed = await createSignedUpload.mutateAsync({
                    bookingId,
                    fileName: file.name,
                    contentType: file.type,
                });

                const res = await fetch(signed.signedUrl, {
                    method: "PUT",
                    body: file,
                    headers: { "Content-Type": file.type },
                });

                if (!res.ok) throw new Error("Upload failed");

                await savePhotoRecord.mutateAsync({
                    bookingId,
                    uploaderId,
                    path: signed.path,
                    imageType: type,
                    contentType: file.type,
                });

                toast.success(`${type.charAt(0) + type.slice(1).toLowerCase()} photo uploaded`);
            } catch (err: any) {
                console.error(err);
                toast.error(err?.message || "Upload failed");
            }
        }

        setUploadingType(null);
        e.target.value = "";
        queryClient.invalidateQueries({ queryKey: trpc.photos.getBookingImages.queryKey({ bookingId }) });
    };

    const images = imagesQuery.data || [];
    const beforeImages = images.filter((img) => img.imageType === "BEFORE");
    const duringImages = images.filter((img) => img.imageType === "DURING");
    const afterImages = images.filter((img) => img.imageType === "AFTER");

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                {/* Before Upload */}
                <div className="relative group">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => handleUpload(e, "BEFORE")}
                        disabled={uploadingType !== null}
                    />
                    <div className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${uploadingType === "BEFORE" ? "bg-blue-50 border-blue-400" : "bg-gray-50 border-gray-200 group-hover:bg-blue-50 group-hover:border-blue-400"
                        }`}>
                        {uploadingType === "BEFORE" ? (
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                        ) : (
                            <Camera className="w-6 h-6 text-blue-500" />
                        )}
                        <span className="text-sm font-semibold text-blue-700">Add Before Photos</span>
                        <span className="text-[10px] text-gray-500">Show the starting point</span>
                    </div>
                </div>

                {/* After Upload */}
                <div className="relative group">
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        onChange={(e) => handleUpload(e, "AFTER")}
                        disabled={uploadingType !== null}
                    />
                    <div className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-2 ${uploadingType === "AFTER" ? "bg-green-50 border-green-400" : "bg-gray-50 border-gray-200 group-hover:bg-green-50 group-hover:border-green-400"
                        }`}>
                        {uploadingType === "AFTER" ? (
                            <Loader2 className="w-6 h-6 text-green-500 animate-spin" />
                        ) : (
                            <CheckCircle2 className="w-6 h-6 text-green-500" />
                        )}
                        <span className="text-sm font-semibold text-green-700">Add After Photos</span>
                        <span className="text-[10px] text-gray-500">Show the transformation</span>
                    </div>
                </div>
            </div>

            <div className="space-y-8">
                {/* Before Gallery */}
                <GallerySection title="Before" images={beforeImages} isLoading={imagesQuery.isLoading} />

                {/* After Gallery */}
                <GallerySection title="After" images={afterImages} isLoading={imagesQuery.isLoading} />

                {/* During/Other Gallery */}
                {duringImages.length > 0 && (
                    <GallerySection title="Work in Progress" images={duringImages} isLoading={imagesQuery.isLoading} />
                )}
            </div>
        </div>
    );
}

function GallerySection({ title, images, isLoading }: { title: string; images: any[]; isLoading: boolean }) {
    if (images.length === 0 && !isLoading) return null;

    return (
        <div className="space-y-3">
            <h4 className="text-sm font-bold text-gray-900 border-l-4 border-primary pl-2 uppercase tracking-wider">{title}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {isLoading ? (
                    [1, 2, 3].map((i) => (
                        <div key={i} className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
                    ))
                ) : (
                    images.map((img) => (
                        <div key={img.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200 shadow-sm group">
                            <img
                                src={img.signedUrl}
                                alt={img.caption || title}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                                <span className="text-[10px] text-white font-medium">{img.caption || title}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
