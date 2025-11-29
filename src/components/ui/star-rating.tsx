
'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  count?: number;
  value: number;
  onChange?: (rating: number) => void;
  readonly?: boolean;
  size?: number;
}

export function StarRating({ count = 5, value = 0, onChange, readonly = false, size = 24 }: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | undefined>(undefined);

  const handleMouseMove = (index: number) => {
    if (readonly) return;
    setHoverValue(index + 1);
  };

  const handleMouseLeave = () => {
    if (readonly) return;
    setHoverValue(undefined);
  };

  const handleClick = (index: number) => {
    if (readonly) return;
    onChange?.(index + 1);
  };

  const stars = Array(count).fill(0);

  return (
    <div className="flex items-center" onMouseLeave={handleMouseLeave}>
      {stars.map((_, index) => {
        const isFilled = (hoverValue || value) > index;
        return (
            <Star
              key={index}
              size={size}
              className={cn(
                "transition-colors",
                !readonly && "cursor-pointer",
                isFilled ? "text-amber-400" : "text-muted-foreground"
              )}
              fill={isFilled ? 'currentColor' : 'none'}
              onMouseMove={() => handleMouseMove(index)}
              onClick={() => handleClick(index)}
            />
        );
      })}
    </div>
  );
}
