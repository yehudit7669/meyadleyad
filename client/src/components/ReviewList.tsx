// Reviews List Component
import { useQuery } from '@tanstack/react-query';
import { reviewsService } from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface ReviewListProps {
  targetId: string;
  targetType: 'user' | 'ad';
}

export default function ReviewList({ targetId, targetType }: ReviewListProps) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['reviews', targetType, targetId],
    queryFn: () => reviewsService.getReviews(targetId, targetType),
  }) as { data: any[] | undefined; isLoading: boolean };

  if (isLoading) {
    return <div className="text-center py-8">טוען ביקורות...</div>;
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-5xl mb-3">⭐</div>
        <p>אין ביקורות עדיין</p>
      </div>
    );
  }

  // Calculate average rating
  const avgRating = (
    reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <div dir="rtl">
      {/* Rating Summary */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="text-6xl font-bold text-yellow-600">{avgRating}</div>
          <div>
            <div className="flex text-2xl mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star}>{star <= Math.round(parseFloat(avgRating)) ? '⭐' : '☆'}</span>
              ))}
            </div>
            <div className="text-gray-600">מבוסס על {reviews.length} ביקורות</div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="mt-4 space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = reviews.filter((r: any) => r.rating === stars).length;
            const percentage = (count / reviews.length) * 100;

            return (
              <div key={stars} className="flex items-center gap-3">
                <div className="w-20 text-sm">{stars} כוכבים</div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-500 h-2 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <div className="w-12 text-sm text-gray-600">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review: any) => (
          <div key={review.id} className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {review.author.name[0]}
                </div>
                <div>
                  <div className="font-bold">{review.author.name}</div>
                  <div className="text-sm text-gray-500">
                    {formatDistanceToNow(new Date(review.createdAt), {
                      addSuffix: true,
                      locale: he,
                    })}
                  </div>
                </div>
              </div>
              <div className="flex text-xl">
                {[1, 2, 3, 4, 5].map((star) => (
                  <span key={star}>{star <= review.rating ? '⭐' : '☆'}</span>
                ))}
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed">{review.comment}</p>

            {review.response && (
              <div className="mt-4 mr-8 p-4 bg-blue-50 border-r-4 border-blue-500 rounded">
                <div className="text-sm font-bold text-blue-800 mb-1">תגובת המוכר:</div>
                <p className="text-gray-700">{review.response}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
