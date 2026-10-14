"use client";

import { useEffect, useState } from "react";
import { Save } from "lucide-react";
import { api } from "@/lib/api";

interface RewardSettings {
  pointsPerAmount: number;
  amountThreshold: number;
  valuePerPoint: number;
  maxRedemptionPercent: number;
}

const defaults: RewardSettings = {
  pointsPerAmount: 1,
  amountThreshold: 100,
  valuePerPoint: 10,
  maxRedemptionPercent: 20,
};

export default function RewardsSettingsPage() {
  const [settings, setSettings] = useState(defaults);
  const [message, setMessage] = useState("");

  useEffect(() => {
    api.adminGetRewardSettings()
      .then((data) => setSettings(data as RewardSettings))
      .catch((error) => setMessage(error instanceof Error ? error.message : "Could not load reward settings."));
  }, []);

  function update(key: keyof RewardSettings, value: string) {
    setSettings((current) => ({ ...current, [key]: Number(value) }));
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    try {
      await api.adminSaveRewardSettings(settings);
      setMessage("Reward settings saved. New checkouts will use these rules.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not save reward settings.");
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <header>
        <h1 className="font-serif text-3xl text-[#0A2540]">Reward Settings</h1>
        <p className="mt-2 text-sm text-neutral-500">Set how customers earn and redeem loyalty points.</p>
      </header>
      <form onSubmit={save} className="space-y-5 rounded-xl border border-neutral-200 bg-white p-6">
        <label className="block text-sm text-neutral-700">
          Points earned
          <div className="mt-1 flex items-center gap-2">
            <input type="number" min="1" step="1" value={settings.pointsPerAmount} onChange={(e) => update("pointsPerAmount", e.target.value)} className="w-28 rounded-lg border border-neutral-300 p-3" />
            <span>points per</span>
            <input type="number" min="0.01" step="0.01" value={settings.amountThreshold} onChange={(e) => update("amountThreshold", e.target.value)} className="w-32 rounded-lg border border-neutral-300 p-3" />
            <span>GBP spent</span>
          </div>
        </label>
        <label className="block text-sm text-neutral-700">
          Value of one point (GBP)
          <input type="number" min="0.01" step="0.01" value={settings.valuePerPoint} onChange={(e) => update("valuePerPoint", e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 p-3" />
        </label>
        <label className="block text-sm text-neutral-700">
          Maximum redemption (% of subtotal)
          <input type="number" min="0" max="100" step="1" value={settings.maxRedemptionPercent} onChange={(e) => update("maxRedemptionPercent", e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 p-3" />
        </label>
        {message && <p className="text-sm text-[#0A2540]">{message}</p>}
        <button className="flex items-center gap-2 rounded-lg bg-[#0A2540] px-4 py-3 text-sm font-medium text-white">
          <Save className="h-4 w-4" /> Save reward settings
        </button>
      </form>
    </div>
  );
}
