import EditPurchaseClient from '@/components/purchases/EditPurchaseClient';

// For static export, provide empty generateStaticParams
export async function generateStaticParams() {
  return [];
}

export default function Page() {
  return <EditPurchaseClient />;
}
