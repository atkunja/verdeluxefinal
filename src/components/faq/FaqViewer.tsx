import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

export function FaqViewer() {
  const trpc = useTRPC();
  const { data: faqs, isLoading, isError } = useQuery(trpc.faq.getFaqs.queryOptions());

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Failed to load FAQs</div>;

  return (
    <div>
      <h2>Frequently Asked Questions</h2>
      {faqs?.map((faq) => (
        <div key={faq.id}>
          <h3>{faq.question}</h3>
          <p>{faq.answer}</p>
        </div>
      ))}
    </div>
  );
}
