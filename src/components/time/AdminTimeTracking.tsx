import { useState } from "react";
import { api } from "~/utils/api";

export function AdminTimeTracking() {
  const [userId, setUserId] = useState<number | null>(null);
  const { data: timeEntries, error, isLoading } = api.time.getTimeEntries.useQuery(
    { userId: userId! },
    { enabled: !!userId }
  );

  // TODO: Add UI for selecting a user

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h2>Time Entries</h2>
      {/* TODO: Add UI for updating and deleting time entries */}
      <ul>
        {timeEntries?.map((entry) => (
          <li key={entry.id}>
            {entry.startTime.toLocaleString()} - {entry.endTime?.toLocaleString() || "Active"}
          </li>
        ))}
      </ul>
    </div>
  );
}
