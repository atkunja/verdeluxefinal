import { createFileRoute } from "@tanstack/react-router";
import { Layout } from "~/components/Layout";

export const Route = createFileRoute("/enhancement-plan")({
  component: EnhancementPlanPage,
});

const phases = [
  { title: "Phase 1 • Foundation", items: ["Core booking CRUD", "Client/Cleaner portals", "Stripe charges & holds"] },
  { title: "Phase 2 • Operations", items: ["Calendar drag/drop", "Time tracking & GPS notes", "Photo uploads"] },
  { title: "Phase 3 • Finance", items: ["Bank transactions sync scaffolding", "Accounting dashboard", "Cleaner payouts planning"] },
  { title: "Phase 4 • CRM + Comms", items: ["Messaging panel", "Kanban CRM dashboard", "Lead capture quiz"] },
  { title: "Phase 5 • Automation", items: ["Reminders & notifications", "Review gate", "Invoice templates"] },
  { title: "Phase 6 • Insights", items: ["Revenue reports revamp", "Filters & exports", "Payment/tip tracking"] },
  { title: "Phase 7 • UX polish", items: ["Brand theming", "Accessibility & mobile QA", "SEO + content pages"] },
];

function EnhancementPlanPage() {
  return (
    <Layout>
      <section className="bg-[#edeae1] py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-sm uppercase tracking-[0.25em] text-[#7a766c]">Roadmap</p>
            <h1 className="text-3xl md:text-4xl font-bold text-[#163022]">LuxeClean Enhancement Plan</h1>
            <p className="text-base text-[#5c5a55] mt-4">
              A seven-phase rollout to deliver the full booking, finance, CRM, and automation experience.
            </p>
          </div>

          <div className="grid gap-4 md:gap-6 max-w-4xl mx-auto">
            {phases.map((phase) => (
              <div
                key={phase.title}
                className="bg-white border border-[#d7d1c4] rounded-xl p-5 md:p-6 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-[#163022]">{phase.title}</h3>
                    <ul className="mt-2 space-y-1 text-sm text-[#4b4a45] list-disc list-inside">
                      {phase.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <span className="text-xs font-semibold text-[#7a766c] bg-[#edeae1] px-3 py-1 rounded-full uppercase">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
