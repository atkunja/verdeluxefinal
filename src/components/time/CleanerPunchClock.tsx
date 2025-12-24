import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "~/stores/authStore";
import { useTRPC } from "~/trpc/react";
import { Clock, MapPin } from "lucide-react";

interface CleanerPunchClockProps {
  activeBookings?: { id: number; label: string }[];
}

export function CleanerPunchClock({ activeBookings }: CleanerPunchClockProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [coords, setCoords] = useState<{ lat?: number; lng?: number }>({});
  const [locationNote, setLocationNote] = useState("");

  const entriesQuery = useQuery({
    ...trpc.time.getTimeEntries.queryOptions({ userId: user?.id ?? 0 }),
    enabled: Boolean(user?.id),
  });

  const activeEntry = useMemo(
    () => entriesQuery.data?.find((entry) => !entry.endTime),
    [entriesQuery.data]
  );
  const [selectedBookingId, setSelectedBookingId] = useState<number | undefined>(activeEntry?.bookingId);

  const punchInMutation = useMutation(
    trpc.time.punchIn.mutationOptions({
      onSuccess: () => {
        toast.success("Punched in");
        queryClient.invalidateQueries({ queryKey: trpc.time.getTimeEntries.queryKey() });
      },
      onError: (error) => toast.error(error.message || "Failed to punch in"),
    })
  );

  const punchOutMutation = useMutation(
    trpc.time.punchOut.mutationOptions({
      onSuccess: () => {
        toast.success("Punched out");
        queryClient.invalidateQueries({ queryKey: trpc.time.getTimeEntries.queryKey() });
      },
      onError: (error) => toast.error(error.message || "Failed to punch out"),
    })
  );

  const captureLocation = () =>
    new Promise<{ lat?: number; lng?: number }>((resolve) => {
      if (!navigator.geolocation) return resolve({});
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => resolve({}),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });

  const handlePunch = async () => {
    if (!user?.id) {
      toast.error("Missing user session");
      return;
    }
    const loc = await captureLocation();
    setCoords(loc);
    if (activeEntry) {
      punchOutMutation.mutate({ userId: user.id, lat: loc.lat, lng: loc.lng, locationNote });
    } else {
      punchInMutation.mutate({ userId: user.id, bookingId: selectedBookingId, lat: loc.lat, lng: loc.lng, locationNote });
    }
  };

  const isLoading =
    entriesQuery.isLoading || punchInMutation.isPending || punchOutMutation.isPending;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
          <Clock className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-sm text-gray-600">Time Tracking</p>
          <p className="text-lg font-semibold text-gray-900">
            {activeEntry ? "Currently punched in" : "Currently punched out"}
          </p>
          {entriesQuery.isError && (
            <p className="text-xs text-red-600 mt-1">Failed to load time entries</p>
          )}
        </div>
        <button
          onClick={handlePunch}
          disabled={isLoading}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
            activeEntry
              ? "bg-red-100 text-red-700 hover:bg-red-200"
              : "bg-primary text-white hover:bg-primary-dark"
          } ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {activeEntry ? "Punch Out" : "Punch In"}
        </button>
      </div>
      {activeBookings && activeBookings.length > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-700">
          <span className="text-gray-600">Booking:</span>
          <select
            value={selectedBookingId ?? ""}
            onChange={(e) => setSelectedBookingId(e.target.value ? Number(e.target.value) : undefined)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1"
          >
            <option value="">None</option>
            {activeBookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <MapPin className="w-4 h-4 text-primary" />
        <input
          type="text"
          value={locationNote}
          onChange={(e) => setLocationNote(e.target.value)}
          placeholder="Optional location note (e.g., front door, lobby)"
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
      </div>
    </div>
  );
}
