import logoAsset from '@/assets/brand/aibean-logo-primary.svg.asset.json';
import beanAsset from '@/assets/brand/bean-mark-transparent.png.asset.json';
import { cn } from '@/lib/utils';

type BrandLogoProps = {
  compact?: boolean;
  inverse?: boolean;
  className?: string;
};

export function BrandLogo({ compact = false, inverse = false, className }: BrandLogoProps) {
  return (
    <img
      src={compact ? beanAsset.url : logoAsset.url}
      alt={compact ? '' : 'aiBean'}
      aria-hidden={compact ? true : undefined}
      className={cn('block object-contain', inverse && 'brightness-0 invert', className)}
    />
  );
}