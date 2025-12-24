import { useState } from "react";
import { api } from "~/utils/api";

export function EmailTemplates() {
  const { data: templates, isLoading } = api.email.getEmailTemplates.useQuery();
  const createMutation = api.email.createEmailTemplate.useMutation();

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const handleCreate = () => {
    createMutation.mutate({ name, subject, body });
  };

  // TODO: Add UI for updating and deleting templates

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h3>Email Templates</h3>
      <div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
        <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
        <textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Body" />
        <button onClick={handleCreate} disabled={createMutation.isLoading}>Create</button>
      </div>
      <ul>
        {templates?.map((template) => (
          <li key={template.id}>{template.name}</li>
        ))}
      </ul>
    </div>
  );
}
