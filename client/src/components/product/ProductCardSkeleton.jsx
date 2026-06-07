const ProductCardSkeleton = () => {
  const shimmerStyle = {
    animation: 'shimmer 2s infinite',
    backgroundSize: '200% 100%',
    backgroundImage:
      'linear-gradient(90deg, #f3f4f6 0%, #ffffff 50%, #f3f4f6 100%)',
  };

  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>

      <div className="bg-white shadow-sm">
        {/* Image Area */}
        <div
          style={{
            aspectRatio: '3/4',
            ...shimmerStyle,
          }}
        />

        {/* Content Area */}
        <div className="p-4">
          {/* Brand */}
          <div
            className="h-3 w-16 mb-2"
            style={shimmerStyle}
          />

          {/* Product Name */}
          <div className="space-y-2 mb-3">
            <div
              className="h-5 w-full"
              style={shimmerStyle}
            />
            <div
              className="h-5 w-2/3"
              style={shimmerStyle}
            />
          </div>

          {/* Rating */}
          <div
            className="h-4 w-24 mb-3"
            style={shimmerStyle}
          />

          {/* Price */}
          <div
            className="h-5 w-32"
            style={shimmerStyle}
          />
        </div>
      </div>
    </>
  );
};

export default ProductCardSkeleton;
