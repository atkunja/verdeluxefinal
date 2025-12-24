import { api } from "~/utils/api";

export function DocumentLibrary() {
  // This is a placeholder. A real implementation would fetch the documents
  // from a database and allow for uploading and deleting them.
  const { data: documents, isLoading } = api.documents.getDocuments.useQuery();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Document Library</h2>
      {/* TODO: Add UI for uploading documents */}
      <ul>
        {documents?.map((doc) => (
          <li key={doc.id}>
            <a href={doc.fileUrl} target="_blank" rel="noreferrer">
              {doc.fileName}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
