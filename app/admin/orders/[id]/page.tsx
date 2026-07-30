import { notFound } from "next/navigation";
import { getOrderById } from "../mockOrders";
import OrderDetailClient from "./OrderDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailPage({ params }: PageProps) {
  const { id } = await params;
  const order = getOrderById(id);

  if (!order) {
    notFound();
  }

  return <OrderDetailClient order={order} />;
}
