import { useState } from 'react';
import { Shield } from 'lucide-react';

const AuthenticityBadge = () => {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        className="border border-red-600 px-4 py-3 flex items-center gap-3 cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <Shield size={16} className="text-red-600 flex-shrink-0" />
        <div>
          <p className="font-body text-sm font-medium text-black">
            Authenticity Verified
          </p>
          <p className="font-body text-xs text-gray-600">
            Direct import from Japan
          </p>
        </div>
      </div>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full mb-2 left-0 bg-black text-white text-xs font-body px-3 py-2 rounded z-10 whitespace-nowrap">
          All HOMA products are sourced directly from certified Japanese
          manufacturers.
          <div className="absolute top-full left-2 w-2 h-2 bg-black transform rotate-45" />
        </div>
      )}
    </div>
  );
};

export default AuthenticityBadge;
