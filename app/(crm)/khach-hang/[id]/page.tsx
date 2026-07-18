import { CustomerWorkspace } from "./_components/customer-workspace";

export default async function CustomerDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <CustomerWorkspace id={id} />;
}
