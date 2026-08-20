import { notFound } from "next/navigation";
import { getDisputeById } from "../mockDisputes";
import DisputeDetailClient from "./DisputeDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function DisputeDetailPage({ params }: PageProps) {
  const { id } = await params;
  const dispute = getDisputeById(id);

  if (!dispute) {
    notFound();
  }

  return <DisputeDetailClient dispute={dispute} />;
}
