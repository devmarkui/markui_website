interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function CareerDetailPage({
  params,
}: PageProps) {
  const { slug } = await params;

  return (
    <main>
      <h1>Career Detail Page</h1>
      <p>Job: {slug}</p>
    </main>
  );
}