"use client";

import { useState } from "react";
import { Montserrat } from "next/font/google";

const mono = Montserrat({ subsets: ["latin"], weight: "400" });
const semibold = Montserrat({ subsets: ["latin"], weight: "600" });

type Rule = {
  id: string;
  rule_type: string;
  name: string;
  base_price: number;
  unit: string;
  active: boolean;
  description?: string;
};

const TYPE_LABELS: Record<string, string> = {
  shoot_type: "Shoot Types",
  package: "Packages",
  addon: "Add-ons",
  modifier: "Modifiers",
};

export default function PricingEditor({ initialRules }: { initialRules: Rule[] | null }) {
  const [rules, setRules] = useState<Rule[]>(initialRules ?? []);
  const [saving, setSaving] = useState<string | null>(null);

  if (!initialRules) {
    return (
      <div className={`border border-white/10 rounded-xl p-10 text-center text-white/30 text-sm ${mono.className}`}>
        Backend not connected — pricing rules will appear here once deployed.
        <br />
        <span className="text-xs mt-2 block">Default rules are seeded on first deploy via <code className="font-mono text-white/50">python -m app.seed</code></span>
      </div>
    );
  }

  const grouped = Object.entries(TYPE_LABELS).map(([type, label]) => ({
    type,
    label,
    rules: rules.filter((r) => r.rule_type === type),
  }));

  const handlePriceChange = async (id: string, newPrice: number) => {
    setSaving(id);
    const API = process.env.NEXT_PUBLIC_API_URL ?? "";
    try {
      const res = await fetch(`${API}/api/v1/admin/pricing-rules/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_price: newPrice }),
      });
      if (res.ok) {
        setRules((prev) => prev.map((r) => (r.id === id ? { ...r, base_price: newPrice } : r)));
      }
    } catch {}
    setSaving(null);
  };

  return (
    <div className={`flex flex-col gap-8 ${mono.className}`}>
      {grouped.map(({ type, label, rules: group }) => (
        <div key={type}>
          <p className="text-xs tracking-[4px] text-white/40 mb-4">{label.toUpperCase()}</p>
          <div className="flex flex-col gap-2">
            {group.map((rule) => (
              <div
                key={rule.id}
                className={`border rounded-xl p-4 flex items-center justify-between gap-4 transition-colors ${
                  rule.active ? "border-white/10" : "border-white/5 opacity-50"
                }`}
              >
                <div className="flex-1">
                  <p className={`text-sm ${semibold.className}`}>{rule.name}</p>
                  {rule.description && <p className="text-xs text-white/40 mt-0.5">{rule.description}</p>}
                </div>
                {rule.unit !== "percentage" && (
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-sm">$</span>
                    <input
                      type="number"
                      defaultValue={rule.base_price}
                      min={0}
                      step={5}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val !== rule.base_price) handlePriceChange(rule.id, val);
                      }}
                      className="w-20 px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-sm text-white focus:outline-none focus:border-white/30 text-right"
                    />
                    {saving === rule.id && <span className="text-xs text-white/30">saving…</span>}
                  </div>
                )}
                {rule.unit === "percentage" && (
                  <p className="text-sm text-white/50">15% (modifier)</p>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
