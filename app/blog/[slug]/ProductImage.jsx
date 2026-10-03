'use client';

// "Recommended Gear" ki tasveer — Amazon ki image toot jaye to placeholder.
// `onError` browser ka event hai, is liye yeh chhota sa hissa client par.
export default function ProductImage({ src, alt }) {
  return (
    <img loading="lazy" decoding="async"
      src={src}
      alt={alt}
      className="w-full h-full object-contain rounded-lg"
      onError={(e) => { e.currentTarget.src = '/placeholder-product.svg'; }}
    />
  );
}
