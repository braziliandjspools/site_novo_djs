import { AdminGate } from "../../../AdminGate";
import { AdminProductionEdit } from "../../../AdminProductionEdit";

export default async function EditProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AdminGate><AdminProductionEdit id={id} /></AdminGate>;
}
