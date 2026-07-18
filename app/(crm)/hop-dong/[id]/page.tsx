import { RecordDetailPage } from "@/components/detail/record-detail-page";

export default async function ContractDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailPage kind="contract" id={id} />;
}
