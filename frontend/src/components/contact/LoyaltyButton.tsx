import Link from "next/link";
import { Gift } from "lucide-react";

export default function LoyaltyButton() {
  return (
    <Link
      href="/account"
      aria-label="Open loyalty rewards"
      title="Loyalty rewards"
      className="fixed bottom-5 left-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#C5DC3B] text-[#0A2540] shadow-lg transition-transform hover:scale-105"
    >
      <Gift className="h-6 w-6" />
    </Link>
  );
}
