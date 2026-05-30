import { db } from "@/lib/db";
import { subscriptions, tenants } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { PLANS, type PlanId } from "@/lib/stripe/pricing";

interface SubscriptionData {
  plan: PlanId;
  planName: string;
  planPrice: number;
  docsLimit: number | null;
  multiUser: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  subscription: {
    status: string;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    documentsUsed: number;
  } | null;
}

interface PricingTableProps {
  subscriptionData?: SubscriptionData;
}

const planTiers: { id: PlanId; name: string; price: number }[] = [
  { id: "essentials", name: "Essentials", price: 49 },
  { id: "pro", name: "Pro", price: 79 },
  { id: "team", name: "Team", price: 99 },
];

export default function PricingTable({ subscriptionData }: PricingTableProps) {
  const currentPlan = subscriptionData?.plan;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-800 bg-[#1a2234]">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-800">
            <th className="px-6 py-4 text-xs font-medium uppercase tracking-wider text-gray-400">Feature</th>
            {planTiers.map((tier) => (
              <th
                key={tier.id}
                className={`px-6 py-4 text-center text-sm font-semibold ${
                  currentPlan === tier.id ? "text-blue-400" : "text-gray-300"
                }`}
              >
                {tier.name}
                {currentPlan === tier.id && (
                  <span className="ml-2 inline-flex items-center rounded-full bg-blue-600/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                    Current
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800">
          <tr>
            <td className="px-6 py-4 text-gray-400">Monthly price</td>
            {planTiers.map((tier) => (
              <td
                key={tier.id}
                className={`px-6 py-4 text-center font-medium ${
                  currentPlan === tier.id ? "text-white" : "text-gray-300"
                }`}
              >
                £{tier.price}/mo
              </td>
            ))}
          </tr>
          <tr>
            <td className="px-6 py-4 text-gray-400">Documents</td>
            <td className="px-6 py-4 text-center text-gray-300">10/mo</td>
            <td className="px-6 py-4 text-center text-gray-300">Unlimited</td>
            <td className="px-6 py-4 text-center text-gray-300">Unlimited</td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-gray-400">Custom branding</td>
            <td className="px-6 py-4 text-center text-gray-500">—</td>
            <td className="px-6 py-4 text-center text-gray-300">✓</td>
            <td className="px-6 py-4 text-center text-gray-300">✓</td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-gray-400">PDF & Word export</td>
            <td className="px-6 py-4 text-center text-gray-500">—</td>
            <td className="px-6 py-4 text-center text-gray-300">✓</td>
            <td className="px-6 py-4 text-center text-gray-300">✓</td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-gray-400">Legislative auto-updates</td>
            <td className="px-6 py-4 text-center text-gray-500">—</td>
            <td className="px-6 py-4 text-center text-gray-300">✓</td>
            <td className="px-6 py-4 text-center text-gray-300">✓</td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-gray-400">Team members</td>
            <td className="px-6 py-4 text-center text-gray-500">1</td>
            <td className="px-6 py-4 text-center text-gray-500">1</td>
            <td className="px-6 py-4 text-center text-gray-300">Up to 10</td>
          </tr>
          <tr>
            <td className="px-6 py-4 text-gray-400">Support</td>
            <td className="px-6 py-4 text-center text-gray-300">Email</td>
            <td className="px-6 py-4 text-center text-gray-300">Priority email</td>
            <td className="px-6 py-4 text-center text-gray-300">Dedicated manager</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
