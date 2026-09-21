interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function InsightDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;

  return (
    <main>
      <h1>Insight Detail Page</h1>
      <p>{slug}</p>
    </main>
  );
}