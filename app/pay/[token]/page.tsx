import { BrandMark } from "@/components/brand-mark";
import { PaymentCard } from "@/components/pay/payment-card";
import { decodePaymentSnapshot } from "@/lib/billing/payment";

export const metadata = { title: "Zahlung" };

export default async function PayPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { token } = await params;
  const { s } = await searchParams;
  const snapshot = decodePaymentSnapshot(s);

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center px-4 py-16">
      <div className="mb-6 flex items-center gap-2">
        <BrandMark size="sm" />
        <p className="text-[13px] text-muted">{snapshot?.legalName || "Stefan Dirnberger"}</p>
      </div>
      <PaymentCard token={token} snapshot={snapshot} />
    </main>
  );
}
