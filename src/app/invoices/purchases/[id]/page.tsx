// Placeholder page for dynamic [id] route to satisfy static export requirements
// Exports empty generateStaticParams for routes that nest dynamic segments

export async function generateStaticParams() {
  return [];
}

export default function Page() {
  // This segment is only used to host nested routes like /edit
  return null;
}
