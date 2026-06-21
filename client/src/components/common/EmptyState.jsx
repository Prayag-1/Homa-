const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-12 sm:py-16">
      {Icon && (
        <div className="mb-4">
          <Icon size={48} className="text-gray-400" />
        </div>
      )}

      <h3 className="text-h3 font-display text-black mb-2 text-center">
        {title}
      </h3>

      <p className="font-body text-gray-600 text-center max-w-sm mb-6">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="touch-target px-6 py-2 bg-black text-white font-body text-sm font-medium rounded-full hover:bg-gray-900 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
