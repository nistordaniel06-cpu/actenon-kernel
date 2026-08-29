import { Review } from "@/lib/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Rating } from "@/components/client/rating";
import { formatDayMonth, initials } from "@/lib/utils";

export function ReviewRow({ review }: { review: Review }) {
  return (
    <div className="flex gap-3 border-b border-border/70 py-4 last:border-0">
      <Avatar className="size-10">
        <AvatarImage src={review.avatar} alt={review.author} />
        <AvatarFallback>{initials(review.author)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="font-medium">{review.author}</p>
          <span className="shrink-0 text-xs text-muted-foreground">{formatDayMonth(review.date)}</span>
        </div>
        <Rating value={review.rating} className="mt-0.5" />
        <p className="mt-1.5 text-sm text-foreground/90">{review.comment}</p>
        <p className="mt-1 text-xs text-muted-foreground">{review.serviceName}</p>
      </div>
    </div>
  );
}
