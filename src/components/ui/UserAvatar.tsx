import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from './avatar';
import { useAuthStore } from '../../stores/authStore';
import { supabase } from '../../lib/supabase';

interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  currentUser?: {
    avatar_url?: string | null;
    avatar_source?: string | null;
    first_name?: string;
    last_name?: string;
  };
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export default function UserAvatar({ size = 'md', className = '', currentUser }: UserAvatarProps) {
  const { user } = useAuthStore();
  const [googleAvatarUrl, setGoogleAvatarUrl] = useState<string>('');

  // Query current user data if not provided
  const { data: userData } = useQuery({
    queryKey: ['current-user'],
    enabled: !currentUser && !!user?.id
  });

  // Use provided user or fallback to queried data
  const userToUse = currentUser || userData;

  // Get Google avatar URL from Supabase auth
  useEffect(() => {
    async function fetchGoogleAvatar() {
      if (!user?.id) return;
      
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.user_metadata?.avatar_url) {
          setGoogleAvatarUrl(authUser.user_metadata.avatar_url);
        }
      } catch (error) {
        console.error('Error fetching Google avatar:', error);
      }
    }

    fetchGoogleAvatar();
  }, [user?.id]);

  // Get user initials for fallback
  const getUserInitials = () => {
    if (!userToUse && !user) return 'U';
    
    // Priority: user context store data, then userToUse data, then auth store data
    const firstName = user?.firstName || (userToUse as any)?.first_name || '';
    const lastName = user?.lastName || (userToUse as any)?.last_name || '';
    
    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    return initials || 'U';
  };

  // Get current avatar URL
  const getAvatarUrl = () => {
    // Prioritize the data from the provided currentUser prop
    if (currentUser && currentUser.avatar_url) {
      return currentUser.avatar_url;
    }
    
    // Fallback to userData from query
    if (userToUse && (userToUse as any)?.avatar_url) {
      return (userToUse as any)?.avatar_url;
    }
    
    // Google avatar fallback
    if (googleAvatarUrl) {
      return googleAvatarUrl;
    }
    
    return '';
  };

  const avatarUrl = getAvatarUrl();
  
  // If we have an avatar URL, show the image directly, otherwise show initials
  if (avatarUrl) {
    return (
      <div className={`${sizeClasses[size]} ${className} rounded-full overflow-hidden bg-muted flex items-center justify-center`}>
        <img 
          src={avatarUrl} 
          alt="Avatar del usuario"
          className="w-full h-full object-cover"
          onError={(e) => {
            // If image fails to load, hide it and show fallback
            e.currentTarget.style.display = 'none';
            const nextElement = e.currentTarget.nextSibling as HTMLElement;
            if (nextElement) {
              nextElement.classList.remove('hidden');
            }
          }}
        />
        <div className={`hidden w-full h-full flex items-center justify-center bg-muted text-muted-foreground ${size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}`}>
          {getUserInitials()}
        </div>
      </div>
    );
  }

  return (
    <Avatar className={`${sizeClasses[size]} ${className}`}>
      <AvatarFallback className={size === 'sm' ? 'text-xs' : size === 'md' ? 'text-sm' : 'text-lg'}>
        {getUserInitials()}
      </AvatarFallback>
    </Avatar>
  );
}