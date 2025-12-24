import { useState } from "react";
import { api } from "~/utils/api";

export function BulkUserOps() {
  const [userIds, setUserIds] = useState<number[]>([]);

  const bulkDeleteMutation = api.bulk.bulkDeleteUsers.useMutation();
  const exportCsvQuery = api.bulk.exportUsersToCsv.useQuery(undefined, { enabled: false });

  const handleDelete = () => {
    bulkDeleteMutation.mutate({ userIds });
  };

  const handleExport = () => {
    exportCsvQuery.refetch().then((result) => {
      if (result.data) {
        const blob = new Blob([result.data], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "users.csv";
        a.click();
        URL.revokeObjectURL(url);
      }
    });
  };

  // TODO: Add UI for selecting users

  return (
    <div>
      <h3>Bulk User Operations</h3>
      <button onClick={handleDelete} disabled={bulkDeleteMutation.isLoading}>
        Delete Selected Users
      </button>
      <button onClick={handleExport} disabled={exportCsvQuery.isFetching}>
        Export All Users to CSV
      </button>
    </div>
  );
}
