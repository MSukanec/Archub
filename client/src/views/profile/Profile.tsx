import { useState, useEffect } from 'react';
import { User, Shield, CreditCard } from 'lucide-react';
import { useNavigationStore } from '@/stores/navigationStore';
import ProfileInfo from './ProfileInfo';
import ProfileSecurity from './ProfileSecurity';
import ProfileSubscription from './ProfileSubscription';

const profileTabs = [
  {
    id: 'info',
    label: 'Información Personal',
    icon: User,
    component: ProfileInfo
  },
  {
    id: 'security',
    label: 'Seguridad',
    icon: Shield,
    component: ProfileSecurity
  },
  {
    id: 'subscription',
    label: 'Suscripción',
    icon: CreditCard,
    component: ProfileSubscription
  }
];

export default function Profile() {
  const { setSection, setView } = useNavigationStore();
  const [activeTab, setActiveTab] = useState('info');

  // Set navigation state when component mounts
  useEffect(() => {
    setSection('profile');
    setView('profile-info');
  }, [setSection, setView]);

  const ActiveComponent = profileTabs.find(tab => tab.id === activeTab)?.component || ProfileInfo;

  return (
    <div className="min-h-screen bg-background">
      {/* Header con navegación por pestañas */}
      <div className="bg-card border-b border-border">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Mi Perfil
              </h1>
              <p className="text-sm text-muted-foreground">
                Gestiona tu información personal, seguridad y suscripción
              </p>
            </div>
          </div>

          {/* Navegación por pestañas */}
          <div className="flex space-x-1 bg-muted/30 p-1 rounded-xl">
            {profileTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                    ${isActive 
                      ? 'bg-primary text-primary-foreground shadow-sm' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="bg-background">
        <ActiveComponent />
      </div>
    </div>
  );
}