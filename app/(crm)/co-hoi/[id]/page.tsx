import { RecordDetailPage } from "@/components/detail/record-detail-page";

export default async function DealDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailPage kind="deal" id={id} />;
}
