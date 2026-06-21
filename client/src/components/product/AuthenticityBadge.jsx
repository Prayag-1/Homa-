import { useState } from 'react';
import { Shield } from 'lucide-react';

const AuthenticityBadge = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block max-w-full">
      <div
        className="flex max-w-full cursor-help items-center gap-3 rounded-lg border border-homa-red bg-white px-4 py-3"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Shield size={16} className="flex-shrink-0 text-homa-red" />
        <div className="min-w-0">
          <p className="font-body text-sm font-semibold text-homa-red">
            Authenticity Verified
          </p>
          <p className="font-body text-xs text-homa-red/80">
            Direct import from Japan
          </p>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 z-10 mb-2 w-[min(280px,calc(100vw-32px))] rounded bg-homa-black px-3 py-2 font-body text-xs text-white">
          All HOMA products are sourced directly from certified Japanese
          manufacturers.
          <div className="absolute left-2 top-full h-2 w-2 rotate-45 bg-homa-black" />
        </div>
      )}
    </div>
  );
};

export default AuthenticityBadge;
