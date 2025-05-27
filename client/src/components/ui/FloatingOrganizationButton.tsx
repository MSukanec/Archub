import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { useUserContextStore } from '@/stores/userContextStore';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase';

export default function FloatingOrganizationButton() {
  const [isHovered, setIsHovered] = useState(false);
  const { organizationId, setUserContext } = useUserContextStore();

  // Fetch current organization
  const { data: currentOrg } = useQuery({
    queryKey: ['/api/organizations', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch all organizations for dropdown
  const { data: organizations } = useQuery({
    queryKey: ['/api/organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  const handleOrganizationChange = async (orgId: string) => {
    const org = organizations?.find(o => o.id === orgId);
    if (org) {
      setUserContext({ organizationId: orgId, projectId: null });
    }
  };

  const openCreateOrganizationModal = () => {
    window.dispatchEvent(new CustomEvent('openCreateOrganizationModal'));
  };

  // Get organization initials or logo
  const getOrgDisplay = () => {
    if (!currentOrg) return 'O';
    
    if (currentOrg.logo_url) {
      return (
        <img 
          src={currentOrg.logo_url} 
          alt={currentOrg.name}
          className="w-5 h-5 rounded object-cover"
        />
      );
    }
    
    // Generate initials from organization name
    const words = currentOrg.name.split(' ');
    if (words.length >= 2) {
      return words[0][0] + words[1][0];
    }
    return currentOrg.name.substring(0, 2);
  };

  return (
    <div 
      className="fixed top-6 right-6 z-50"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={cn(
          "bg-primary hover:bg-primary/90 text-primary-foreground",
          "shadow-lg hover:shadow-xl rounded-xl",
          "flex items-center justify-center cursor-pointer",
          "transition-all duration-300 ease-in-out",
          "border border-primary/20",
          "relative overflow-hidden",
          isHovered 
            ? "h-auto py-3 px-4 min-w-48 flex-col items-start" 
            : "h-14 w-14"
        )}
        style={{
          width: isHovered ? '192px' : '56px',
          transformOrigin: 'top right'
        }}
      >
        {isHovered ? (
          // Show organizations list when hovered
          <div className="space-y-2 w-full">
            {organizations?.map((org) => (
              <div
                key={org.id}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOrganizationChange(org.id);
                }}
                className={cn(
                  "flex items-center text-sm rounded px-2 py-1 cursor-pointer transition-colors w-full text-left",
                  org.id === organizationId 
                    ? "bg-primary-foreground/20" 
                    : "hover:bg-primary-foreground/10"
                )}
              >
                <div className="w-4 h-4 mr-2 flex items-center justify-center text-xs font-bold bg-primary-foreground/20 rounded flex-shrink-0">
                  {org.logo_url ? (
                    <img 
                      src={org.logo_url} 
                      alt={org.name}
                      className="w-full h-full rounded object-cover"
                    />
                  ) : (
                    (() => {
                      const words = org.name.split(' ');
                      return words.length >= 2 ? words[0][0] + words[1][0] : org.name.substring(0, 2);
                    })()
                  )}
                </div>
                <span className="whitespace-nowrap truncate">{org.name}</span>
              </div>
            ))}
            <div className="border-t border-primary-foreground/20 pt-2">
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  openCreateOrganizationModal();
                }}
                className="flex items-center text-sm hover:bg-primary-foreground/10 rounded px-2 py-1 cursor-pointer transition-colors w-full text-left"
              >
                <Building2 size={14} className="mr-2 flex-shrink-0" />
                <span className="whitespace-nowrap">Nueva Organización</span>
              </div>
            </div>
          </div>
        ) : (
          // Show organization initials/logo when not hovered
          <div className="flex items-center justify-center text-sm font-bold">
            {getOrgDisplay()}
          </div>
        )}
      </div>
    </div>
  );
}