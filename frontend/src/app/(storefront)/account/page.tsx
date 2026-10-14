"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Gift, LogOut, Package } from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/currency";

interface CustomerOrder {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: { title: string; quantity: number }[];
}

interface RewardSummary {
  balance: number;
  lifetimeEarned: number;
  valuePerPoint: number;
  pointsPerAmount: number;
  amountThreshold: number;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, logout, hydrate } = useAuthStore();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [rewards, setRewards] = useState<RewardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    hydrate().finally(() => setIsLoading(false));
  }, [hydrate]);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/account/login");
    }
  }, [isLoading, user, router]);

  useEffect(() => {
    if (!user) return;
    api
      .getMyOrders()
      .then((data) => setOrders(data as CustomerOrder[]))
      .catch(() => setOrders([]));
    api
      .getRewards()
      .then((data) => setRewards(data as RewardSummary))
      .catch(() => setRewards(null));
  }, [user]);

  function handleLogout() {
    logout();
    router.push("/");
  }

  if (isLoading || !user) {
    return <main className="px-4 py-16 text-center text-neutral-500">Loading…</main>;
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-16">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-[#0A2540]">Hi, {user.name}</h1>
          <p className="text-sm text-neutral-500">{user.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:border-[#0A2540]"
        >
          <LogOut className="h-4 w-4" /> Log Out
        </button>
      </div>

      {rewards && (
        <div className="mb-8 flex items-center justify-between rounded-xl bg-[#F5F2EC] p-5">
          <div className="flex items-center gap-3">
            <Gift className="h-6 w-6 text-[#0A2540]" />
            <div>
              <h2 className="font-serif text-lg text-[#0A2540]">Reward Points</h2>
              <p className="text-sm text-neutral-600">{rewards.pointsPerAmount} point(s) per £{rewards.amountThreshold}; 1 point = £{rewards.valuePerPoint}</p>
            </div>
          </div>
          <strong className="text-2xl text-[#0A2540]">{rewards.balance}</strong>
        </div>
      )}

      <h2 className="mb-4 font-serif text-lg text-[#0A2540]">Order History</h2>

      {orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 p-10 text-center text-neutral-500">
          <Package className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
          No orders yet.
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o.id} className="rounded-xl border border-neutral-200 p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-[#0A2540]">{o.orderNumber}</span>
                <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                  {o.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-neutral-500">
                {o.items.map((i) => `${i.title} × ${i.quantity}`).join(", ")}
              </p>
              <p className="mt-2 text-sm font-semibold text-neutral-700">
                {formatCurrency(o.totalAmount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
