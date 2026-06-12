import { memo } from 'react';

const colorMap = {
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  blue: 'bg-blue-100 text-blue-800',
  orange: 'bg-orange-100 text-orange-800',
  grey: 'bg-gray-100 text-gray-800',
};

function BadgeComponent({ text, color = 'grey' }) {
  return (
    <span className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${colorMap[color]}`}>
      {text}
    </span>
  );
}

export const Badge = memo(BadgeComponent);
