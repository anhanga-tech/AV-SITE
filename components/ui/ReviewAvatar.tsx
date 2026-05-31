import React, { useState, useRef } from 'react';
import { getInitials } from '../../data/reviewsAdapter';

interface ReviewAvatarProps {
  name: string;
  photoUrl: string | null;
  size?: number;
  className?: string;
}

export const ReviewAvatar: React.FC<ReviewAvatarProps> = ({
  name,
  photoUrl,
  size = 88,
  className = '',
}) => {
  const [hasImageError, setHasImageError] = useState(false);
  const prevPhotoUrl = useRef(photoUrl);
  const initials = getInitials(name);

  if (prevPhotoUrl.current !== photoUrl) {
    prevPhotoUrl.current = photoUrl;
    setHasImageError(false);
  }

  if (!photoUrl || hasImageError) {
    return (
      <div
        className={`rounded-full flex items-center justify-center text-white font-bold shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
          fontSize: size * 0.35,
        }}
        aria-hidden="true"
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      width={size}
      height={size}
      className={`rounded-full object-cover shrink-0 ${className}`}
      onError={() => setHasImageError(true)}
    />
  );
};
