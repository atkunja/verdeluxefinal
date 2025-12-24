import { api } from "~/utils/api";

export function SystemLogs() {
  // This is a basic implementation. A more robust solution would involve
  // creating a dedicated tRPC procedure to fetch and filter system logs.
  // For now, we will assume a procedure `getSystemLogs` exists.
  const { data: logs, isLoading } = api.system.getSystemLogs.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>System Logs</h2>
      {/* TODO: Add UI for filtering logs */}
      <ul>
        {logs?.map((log) => (
          <li key={log.id}>
            {log.createdAt.toLocaleString()} - {log.action} - User: {log.userId}
          </li>
        ))}
      </ul>
    </div>
  );
}
