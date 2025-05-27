import { useFeatures, FeatureName } from '@/hooks/useFeatures';
import { FeaturePopover } from './FeaturePopover';
import { Lock } from 'lucide-react';
import { cloneElement, isValidElement } from 'react';

interface FeatureLockProps {
  feature: FeatureName;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showLockIcon?: boolean;
  lockIconPosition?: 'overlay' | 'inline';
}

export function FeatureLock({ 
  feature, 
  children, 
  fallback,
  showLockIcon = true,
  lockIconPosition = 'overlay'
}: FeatureLockProps) {
  const { hasFeature, isLoading } = useFeatures();

  // Show loading state while checking features
  if (isLoading) {
    return <div className="opacity-50">{children}</div>;
  }

  // If user has access to the feature, render normally
  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // If no access, render locked state
  const lockedContent = (
    <div className="relative inline-block">
      {/* Render children with disabled state */}
      <div className="opacity-40 blur-[1px] pointer-events-none select-none">
        {isValidElement(children) ? 
          cloneElement(children as React.ReactElement, { 
            disabled: true,
            'aria-disabled': true,
            className: `${(children as React.ReactElement).props.className || ''} cursor-not-allowed`
          }) : 
          children
        }
      </div>
      
      {/* Lock icon overlay */}
      {showLockIcon && lockIconPosition === 'overlay' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-background/80 backdrop-blur-sm rounded-full p-2 border border-border">
            <Lock className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      )}
      
      {/* Inline lock icon */}
      {showLockIcon && lockIconPosition === 'inline' && (
        <div className="absolute -top-1 -right-1">
          <div className="bg-background border border-border rounded-full p-1">
            <Lock className="h-3 w-3 text-muted-foreground" />
          </div>
        </div>
      )}
    </div>
  );

  // Wrap with feature popover for upgrade prompt
  return (
    <FeaturePopover feature={feature} asChild>
      <div className="cursor-pointer">
        {fallback || lockedContent}
      </div>
    </FeaturePopover>
  );
}

// Higher-order component version for easier usage
export function withFeatureLock<T extends object>(
  Component: React.ComponentType<T>,
  feature: FeatureName
) {
  return function FeatureLockedComponent(props: T) {
    return (
      <FeatureLock feature={feature}>
        <Component {...props} />
      </FeatureLock>
    );
  };
}