import ReviewsForm from "@/components/admin/ReviewsForm";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/db";

export default async function AdminReviewsPage() {
  await requireAdmin("/admin/reviews");
  const { content } = await getSettings();

  return <ReviewsForm reviews={content.reviews} note={content.home.reviewsNote} />;
}
