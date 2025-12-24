import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import toast from "react-hot-toast";

export function FaqEditor() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { data: faqs, isLoading, isError } = useQuery(trpc.faq.getFaqs.queryOptions());
  const [newFaq, setNewFaq] = useState({ question: "", answer: "", category: "General" });

  const createFaq = useMutation(
    trpc.faq.createFaq.mutationOptions({
      onSuccess: () => {
        toast.success("FAQ created");
        setNewFaq({ question: "", answer: "", category: "General" });
        queryClient.invalidateQueries({ queryKey: trpc.faq.getFaqs.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to create FAQ"),
    })
  );

  const deleteFaq = useMutation(
    trpc.faq.deleteFaq.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: trpc.faq.getFaqs.queryKey() });
      },
      onError: (err) => toast.error(err.message || "Failed to delete FAQ"),
    })
  );

  // This is a placeholder. A real implementation would allow for creating,
  // updating, and deleting FAQs.

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Failed to load FAQs</div>;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="px-4 py-3 border-b border-gray-200">
        <p className="text-xs font-semibold text-primary uppercase">FAQ</p>
        <h3 className="text-lg font-bold text-gray-900">FAQ Editor</h3>
      </div>
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            placeholder="Question"
            value={newFaq.question}
            onChange={(e) => setNewFaq({ ...newFaq, question: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Answer"
            value={newFaq.answer}
            onChange={(e) => setNewFaq({ ...newFaq, answer: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="text"
            placeholder="Category"
            value={newFaq.category}
            onChange={(e) => setNewFaq({ ...newFaq, category: e.target.value })}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={() => createFaq.mutate(newFaq)}
          disabled={createFaq.isPending}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-dark transition disabled:opacity-60"
        >
          Add FAQ
        </button>

        <ul className="divide-y divide-gray-100">
          {faqs?.map((faq) => (
            <li key={faq.id} className="py-2 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-gray-900">{faq.question}</p>
                <p className="text-xs text-gray-600">{faq.answer}</p>
                <p className="text-xs text-gray-500">{faq.category}</p>
              </div>
              <button
                onClick={() => deleteFaq.mutate({ id: faq.id })}
                className="text-red-600 text-xs hover:underline"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
