import { redirect } from "next/navigation";

type PageProps = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };

export default async function LegacyProducerPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const query = await searchParams;
  const page = query.page ? `?page=${encodeURIComponent(query.page)}` : "";
  redirect(`/p/${slug}${page}`);
}
