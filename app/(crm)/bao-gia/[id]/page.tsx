import { RecordDetailPage } from "@/components/detail/record-detail-page";

export default async function QuoteDetailRoute({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <RecordDetailPage kind="quote" id={id} />;
}
