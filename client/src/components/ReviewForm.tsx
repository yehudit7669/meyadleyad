// Review Form Component
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsService } from '../services/api';

interface ReviewFormProps {
  targetId: string;
  targetType: 'user' | 'ad';
  onSuccess?: () => void;
}

export default function ReviewForm({ targetId, targetType, onSuccess }: ReviewFormProps) {
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [hoveredRating, setHoveredRating] = useState(0);

  const createMutation = useMutation({
    mutationFn: () =>
      reviewsService.createReview({
        targetId,
        targetType,
        rating,
        comment,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews', targetType, targetId] });
      setRating(5);
      setComment('');
      onSuccess?.();
      alert('הביקורת נשלחה בהצלחה!');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim().length < 10) {
      alert('הביקורת חייבת להכיל לפחות 10 תווים');
      return;
    }
    createMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6" dir="rtl">
      <h3 className="text-xl font-bold mb-4">כתוב ביקורת</h3>

      {/* Star Rating */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          דירוג
        </label>
        <div className="flex gap-2 items-center">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              aria-label={`דירוג ${star} כוכבים`}
              aria-pressed={rating === star}
              className="text-4xl transition-transform hover:scale-110"
            >
              {star <= (hoveredRating || rating) ? '⭐' : '☆'}
            </button>
          ))}
          <span className="mr-3 text-gray-600 font-medium">
            {rating === 5 ? 'מעולה' : rating === 4 ? 'טוב מאוד' : rating === 3 ? 'בסדר' : rating === 2 ? 'חלש' : 'גרוע'}
          </span>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          תוכן הביקורת
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          minLength={10}
          required
          placeholder="ספר לנו על החוויה שלך..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="text-sm text-gray-500 mt-1">
          {comment.length}/500 תווים
        </div>
      </div>

      <button
        type="submit"
        disabled={createMutation.isPending || comment.length < 10}
        aria-label="שלח ביקורת"
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 disabled:bg-gray-400 transition"
      >
        {createMutation.isPending ? 'שולח...' : 'שלח ביקורת'}
      </button>

      {createMutation.isError && (
        <div className="mt-4 text-red-600 text-sm text-center">
          שגיאה בשליחת הביקורת. נסה שוב.
        </div>
      )}
    </form>
  );
}
