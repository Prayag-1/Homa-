import { memo, useState } from 'react';

const StarRating = ({ rating = 0, count, size = 'md', interactive = false, onRate }) => {
  const [hoverRating, setHoverRating] = useState(0);

  // Size mapping
  const sizeMap = {
    sm: { star: 16, gap: 4 },
    md: { star: 20, gap: 6 },
    lg: { star: 28, gap: 8 },
  };

  const { star: starSize, gap: gapSize } = sizeMap[size];

  // Label for interactive mode
  const labels = {
    1: 'Terrible',
    2: 'Poor',
    3: 'Average',
    4: 'Good',
    5: 'Excellent',
  };

  const displayRating = interactive ? hoverRating || rating : rating;

  // SVG Star component
  const Star = ({ index, isFilled }) => {
    const fillPercentage = Math.min(Math.max(displayRating - index, 0), 1);

    return (
      <svg
        key={index}
        width={starSize}
        height={starSize}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={interactive ? 'cursor-pointer' : ''}
        onClick={() => {
          if (interactive && onRate) {
            onRate(index + 1);
          }
        }}
        onMouseEnter={() => {
          if (interactive) setHoverRating(index + 1);
        }}
        onMouseLeave={() => {
          if (interactive) setHoverRating(0);
        }}
      >
        <defs>
          <linearGradient id={`grad-${index}`} x1="0%" x2="100%">
            <stop offset={`${fillPercentage * 100}%`} stopColor="#C8432B" />
            <stop offset={`${fillPercentage * 100}%`} stopColor="#E5E7EB" />
          </linearGradient>
        </defs>
        <path
          d="M12 2L15.09 10.26H24L17.55 15.73L19.64 24L12 19.54L4.36 24L6.45 15.73L0 10.26H8.91L12 2Z"
          fill={`url(#grad-${index})`}
        />
      </svg>
    );
  };

  return (
    <div className="flex flex-col items-start">
      <div className="flex items-center" style={{ gap: `${gapSize}px` }}>
        <div className="flex" style={{ gap: `${gapSize}px` }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} index={i} isFilled={i < Math.floor(displayRating)} />
          ))}
        </div>

        {count && (
          <span className="text-xs text-gray-600 font-body">
            ({count} {count === 1 ? 'review' : 'reviews'})
          </span>
        )}
      </div>

      {interactive && hoverRating > 0 && (
        <p className="text-xs text-gray-600 font-body mt-1">
          {labels[hoverRating]}
        </p>
      )}
    </div>
  );
};

export default memo(StarRating);
