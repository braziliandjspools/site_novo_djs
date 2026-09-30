import { AdminGate } from "../../../AdminGate";
import { AdminProductionEdit } from "../../../AdminProductionEdit";

export default async function EditProductionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="mx-auto min-h-screen max-w-4xl overflow-x-hidden px-4 py-8 text-white sm:px-6">
      <AdminGate>
        <AdminProductionEdit id={id} />
      </AdminGate>
    </main>
  );
}
