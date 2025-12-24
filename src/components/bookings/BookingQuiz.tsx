import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { ListChecks, Sparkles } from "lucide-react";
import { formatDurationHours } from "~/utils/formatTime";

const FREQUENCIES = ["ONE_TIME", "WEEKLY", "BIWEEKLY", "MONTHLY"];

export function BookingQuiz() {
  const trpc = useTRPC();
  const calculatePrice = useMutation(trpc.booking.calculateQuizPrice.mutationOptions());
  const rulesQuery = useQuery(trpc.booking.getPublicPricingRules.queryOptions());

  const serviceTypes = useMemo(() => {
    const unique = new Set(
      rulesQuery.data?.rules
        .map((r: any) => r.serviceType)
        .filter(Boolean) as string[]
    );
    if (unique.size === 0) {
      return [
        "Standard Home Cleaning",
        "Deep Home Cleaning",
        "Vacation Rental Cleaning",
        "Commercial Cleaning",
        "Move-In/Out Cleaning",
        "Post Construction Cleaning",
      ];
    }
    return Array.from(unique);
  }, [rulesQuery.data]);

  const extras = useMemo(
    () =>
      (rulesQuery.data?.rules || [])
        .filter((r: any) => r.ruleType === "EXTRA_SERVICE")
        .map((r: any) => ({
          id: r.id,
          label: r.extraName || r.name,
          price: r.priceAmount,
        })),
    [rulesQuery.data]
  );

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    serviceType: serviceTypes[0] || "",
    frequency: FREQUENCIES[0],
    houseSquareFootage: 1200,
    basementSquareFootage: 0,
    numberOfBedrooms: 3,
    numberOfBathrooms: 2,
    selectedExtras: [] as number[],
  });

  // When pricing rules load, default the service type
  useEffect(() => {
    if (!form.serviceType && serviceTypes.length > 0) {
      setForm((prev) => ({ ...prev, serviceType: serviceTypes[0] }));
    }
  }, [serviceTypes, form.serviceType]);

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handlePrev = () => setStep((s) => Math.max(s - 1, 1));

  const handleSubmit = () => {
    calculatePrice.mutate({
      serviceType: form.serviceType || serviceTypes[0] || "",
      houseSquareFootage: form.houseSquareFootage,
      basementSquareFootage: form.basementSquareFootage,
      numberOfBedrooms: form.numberOfBedrooms,
      numberOfBathrooms: form.numberOfBathrooms,
      selectedExtras: form.selectedExtras,
    });
  };

  const frequencyLabel = (f: string) => f.replace("_", " ");
  const breakdown = calculatePrice.data?.breakdown ?? [];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
        <span className={`px-2 py-1 rounded-full ${step >= 1 ? "bg-primary/10 text-primary" : "bg-gray-100"}`}>1</span>
        <span>Home details</span>
        <span className="text-gray-400">/</span>
        <span className={`px-2 py-1 rounded-full ${step >= 2 ? "bg-primary/10 text-primary" : "bg-gray-100"}`}>2</span>
        <span>Extras</span>
        <span className="text-gray-400">/</span>
        <span className={`px-2 py-1 rounded-full ${step >= 3 ? "bg-primary/10 text-primary" : "bg-gray-100"}`}>3</span>
        <span>Estimate</span>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Service</label>
            <select
              value={form.serviceType || serviceTypes[0] || ""}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
              className="w-full border border-[#d7d1c4] bg-[#f7f4ed] text-[#163022] rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:border-[#163022]"
            >
              {serviceTypes.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Square Footage</label>
              <input
                type="number"
                value={form.houseSquareFootage}
                onChange={(e) => setForm({ ...form, houseSquareFootage: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min={0}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bedrooms</label>
              <input
                type="number"
                value={form.numberOfBedrooms}
                onChange={(e) => setForm({ ...form, numberOfBedrooms: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Bathrooms</label>
              <input
                type="number"
                value={form.numberOfBathrooms}
                onChange={(e) => setForm({ ...form, numberOfBathrooms: Number(e.target.value) })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                min={1}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Frequency</label>
              <select
                value={form.frequency}
                onChange={(e) => setForm({ ...form, frequency: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <p className="text-sm text-gray-700 font-semibold">Add-ons</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {extras.map((extra) => {
              const checked = form.selectedExtras.includes(extra.id);
              return (
                <label
                  key={extra.id}
                  className={`flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer ${
                    checked ? "border-primary bg-primary/5" : "border-gray-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => {
                      setForm({
                        ...form,
                        selectedExtras: checked
                          ? form.selectedExtras.filter((id) => id !== extra.id)
                          : [...form.selectedExtras, extra.id],
                      });
                    }}
                  />
                  <span className="text-sm text-gray-800">
                    {extra.label}
                    {extra.price ? ` · $${extra.price.toFixed(2)}` : ""}
                  </span>
                </label>
              );
            })}
            {extras.length === 0 && <p className="text-sm text-gray-600">No extras available.</p>}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-gray-900">Your selections</p>
            <p className="text-sm text-gray-700">{form.serviceType}</p>
            <p className="text-sm text-gray-700">
              {form.houseSquareFootage} sqft · {form.numberOfBedrooms} bed · {form.numberOfBathrooms} bath
            </p>
            <p className="text-sm text-gray-700">Frequency: {frequencyLabel(form.frequency)}</p>
            <p className="text-sm text-gray-700">
              Extras: {form.selectedExtras.length > 0 ? form.selectedExtras.length : "None"}
            </p>
          </div>
          <button
            onClick={handleSubmit}
            disabled={calculatePrice.isPending}
            className="w-full px-4 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition"
          >
            {calculatePrice.isPending ? "Calculating..." : "Get Estimate"}
          </button>
          {calculatePrice.isError && (
            <p className="text-sm text-red-600">Failed to calculate estimate. Please try again.</p>
          )}
          {calculatePrice.data && (
            <div className="grid gap-3 md:grid-cols-2">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-800">Estimated Price</p>
                <p className="text-3xl font-bold text-green-900">${calculatePrice.data.price.toFixed(2)}</p>
                {calculatePrice.data.durationHours !== undefined &&
                  calculatePrice.data.durationHours !== null && (
                    <p className="text-sm text-green-700 mt-1">
                      Estimated duration: {formatDurationHours(calculatePrice.data.durationHours)}
                    </p>
                  )}
              </div>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                  <ListChecks className="w-4 h-4" /> Pricing Breakdown
                </p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {breakdown.map((b, idx) => (
                    <li key={`${b.description}-${idx}`} className="flex justify-between">
                      <span>{b.description}</span>
                      <span className="font-semibold">${b.amount.toFixed(2)}</span>
                    </li>
                  ))}
                  {breakdown.length === 0 && <li className="text-xs text-gray-500">No breakdown available.</li>}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-center mt-6">
        <button
          onClick={handlePrev}
          disabled={step === 1}
          className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={step === 3 ? handleSubmit : handleNext}
          className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary-dark"
        >
          {step === 3 ? "Get Estimate" : "Next"}
        </button>
      </div>

      {rulesQuery.data && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Sparkles className="w-4 h-4" /> How we price
          </p>
          <div className="grid gap-3 md:grid-cols-2 mt-2 text-sm text-gray-700">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Base & Rates</p>
              {(rulesQuery.data.rules || [])
                .filter((r: any) => ["BASE_PRICE", "SQFT_RATE", "BEDROOM_RATE", "BATHROOM_RATE"].includes(r.ruleType))
                .slice(0, 4)
                .map((r: any) => (
                  <div key={r.id} className="flex justify-between">
                    <span>{r.name}</span>
                    {r.priceAmount !== null && <span>${r.priceAmount?.toFixed(2)}</span>}
                    {r.ratePerUnit !== null && <span>${r.ratePerUnit?.toFixed(2)}/unit</span>}
                  </div>
                ))}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Popular Extras</p>
              {extras.slice(0, 4).map((x) => (
                <div key={x.id} className="flex justify-between">
                  <span>{x.label}</span>
                  {x.price !== null && <span>${(x.price ?? 0).toFixed(2)}</span>}
                </div>
              ))}
              {extras.length === 0 && <p className="text-xs text-gray-500">Extras will appear when configured.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
