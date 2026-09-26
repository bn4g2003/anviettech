import { DealWorkspace } from "./_components/deal-workspace";

export default async function DealDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <DealWorkspace id={id} />;
}
