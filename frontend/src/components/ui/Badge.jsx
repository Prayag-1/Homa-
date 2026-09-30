import { memo } from 'react';

const colorMap = {
  red: 'bg-homa-red text-white',
  blush: 'bg-homa-blush text-homa-red',
  grey: 'bg-[#F0F0F0] text-homa-grey',
  black: 'bg-homa-black text-white',
  green: 'bg-[#E8F5E9] text-[#2E7D32]',
  orange: 'bg-[#FFF3E0] text-[#E65100]',
  blue: 'bg-homa-red-light text-homa-red',
};

function BadgeComponent({ text, children, color = 'grey', className = '' }) {
  return (
    <span
      className={[
        'inline-block max-w-full break-words rounded-pill px-2.5 py-[3px] font-body text-[11px] font-semibold uppercase tracking-[0.08em]',
        colorMap[color] || colorMap.grey,
        className,
      ].join(' ')}
    >
      {children || text}
    </span>
  );
}

export const Badge = memo(BadgeComponent);
