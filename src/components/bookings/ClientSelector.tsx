import { useMemo, useState } from "react";

export interface ClientOption {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  lastAddress?: string | null;
}

interface ClientSelectorProps {
  options: ClientOption[];
  onSelect: (client: ClientOption) => void;
  placeholder?: string;
}

export function ClientSelector({ options, onSelect, placeholder = "Select a client" }: ClientSelectorProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    if (!query) return options.slice(0, 6);
    const q = query.toLowerCase();
    return options.filter((opt) => opt.name.toLowerCase().includes(q) || opt.email.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{placeholder}</label>
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-[#163022] focus:outline-none focus:ring-2 focus:ring-[#163022]"
        placeholder="Type name or email"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
          {filtered.map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => {
                onSelect(opt);
                setQuery(opt.name);
                setOpen(false);
              }}
              className="flex w-full items-start gap-3 px-3 py-2 text-left text-sm hover:bg-gray-50"
            >
              <div>
                <div className="font-semibold text-[#0f172a]">{opt.name}</div>
                <div className="text-xs text-gray-500">{opt.email}</div>
                {opt.phone && <div className="text-xs text-gray-500">{opt.phone}</div>}
              </div>
            </button>
          ))}
        </div>
      )}
      {open && filtered.length === 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-dashed border-gray-200 bg-white px-3 py-2 text-sm text-gray-500">
          No clients match. Create new.
        </div>
      )}
    </div>
  );
}
