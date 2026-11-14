import React, { useState, useEffect } from 'react';
import type { AppSettings, Client } from './types.js';
import { api, createRealtimeSocket } from './api.js';
import { Navbar } from './components/Navbar.js';
import { Hero } from './components/Hero.js';
import { ProductCatalog } from './components/ProductCatalog.js';
import { PartnersBannerSection } from './components/PartnersBannerSection.js';
import { HowItWorks } from './components/HowItWorks.js';
import { CustomerTestimonials } from './components/CustomerTestimonials.js';
import { ReferralProgramSection } from './components/ReferralProgramSection.js';
import { FAQ } from './components/FAQ.js';
import { Footer } from './components/Footer.js';
import { ClientRegistrationModal } from './components/ClientRegistrationModal.js';
import { ClientPortal } from './components/ClientPortal.js';
import { OwnerDashboard } from './components/OwnerDashboard.js';
import { PWAInstallButton } from './components/PWAInstallButton.js';
import { OfflineIndicator } from './components/OfflineIndicator.js';

const DEFAULT_SETTINGS: AppSettings = {
  prices: { 250: 13, 500: 20, 1000: 36 },
  avulsoPrices: { 250: 15, 500: 25, 1000: 40 },
  goal: 10,
  whatsapp: '21981142230',
  ownerPasswordHash: '',
  pixKey: '21981142230',
};

export default function App() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const cached = localStorage.getItem('amigusto_cached_config');
      if (cached) return JSON.parse(cached);
    } catch {
      // ignore
    }
    return DEFAULT_SETTINGS;
  });

  // Client session
  const [activeClient, setActiveClient] = useState<{ code: string; name: string } | null>(() => {
    try {
      const stored = localStorage.getItem('amigusto_active_client');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return null;
  });

  // Modals state
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isClientPortalOpen, setIsClientPortalOpen] = useState(false);
  const [isOwnerDashboardOpen, setIsOwnerDashboardOpen] = useState(false);

  // Pre-selected choices from catalog
  const [selectedSize, setSelectedSize] = useState<'250' | '500' | '1000'>('500');
  const [selectedType, setSelectedType] = useState<'assinatura' | 'avulsa'>('assinatura');
  const [initialReferralCode, setInitialReferralCode] = useState('');
  const [isAdminClientSession, setIsAdminClientSession] = useState(false);

  useEffect(() => {
    loadSettings();
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref');
      if (refParam) {
        setInitialReferralCode(refParam.toUpperCase().trim());
        setIsRegisterOpen(true);
      }
    }

    const unsubscribe = createRealtimeSocket((evt) => {
      if (evt.type === 'PARTNERS_UPDATED') {
        setSettings(prev => ({ ...prev, partners: evt.partners }));
      } else if (evt.type === 'CONFIG_UPDATED') {
        setSettings(evt.settings);
        try {
          localStorage.setItem('amigusto_cached_config', JSON.stringify(evt.settings));
        } catch {
          // ignore
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getConfig();
      setSettings(data);
    } catch (err) {
      console.warn('Could not fetch server settings, using cache or defaults:', err);
    }
  };

  const handleSelectProduct = (size: '250' | '500' | '1000', type: 'assinatura' | 'avulsa') => {
    setSelectedSize(size);
    setSelectedType(type);
    setIsRegisterOpen(true);
  };

  const handleRegistrationSuccess = (newClient: Client, _plainPw: string) => {
    const session = { code: newClient.code, name: newClient.name };
    setActiveClient(session);
    try {
      localStorage.setItem('amigusto_active_client', JSON.stringify(session));
    } catch {
      // ignore
    }
  };

  const handleClientLogin = (loggedInClient: Client) => {
    const session = { code: loggedInClient.code, name: loggedInClient.name };
    setActiveClient(session);
    try {
      localStorage.setItem('amigusto_active_client', JSON.stringify(session));
    } catch {
      // ignore
    }
  };

  const handleClientLogout = () => {
    setActiveClient(null);
    try {
      localStorage.removeItem('amigusto_active_client');
    } catch {
      // ignore
    }
  };

  const handleImpersonateClient = (clientToView: Client) => {
    setActiveClient({ code: clientToView.code, name: clientToView.name });
    setIsAdminClientSession(true);
    setIsOwnerDashboardOpen(false);
    setIsClientPortalOpen(true);
  };

  const handleReturnToOwner = () => {
    setIsClientPortalOpen(false);
    setIsOwnerDashboardOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-900 dark:bg-stone-950 dark:text-stone-100 transition-colors">
      {/* Top Smart PWA Install Banner */}
      <PWAInstallButton variant="banner" />

      {/* Main Top Bar */}
      <Navbar
        onOpenClientPortal={() => setIsClientPortalOpen(true)}
        onOpenOwnerPortal={() => setIsOwnerDashboardOpen(true)}
        activeClientCode={activeClient?.code}
        activeClientName={activeClient?.name}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        <Hero
          onStartRegistration={() => setIsRegisterOpen(true)}
          onOpenClientPortal={() => setIsClientPortalOpen(true)}
        />

        <ProductCatalog
          settings={settings}
          onSelectProduct={handleSelectProduct}
        />

        {/* Banner de Parceiros no Meio da Home Page */}
        <PartnersBannerSection
          partners={settings.partners || []}
          whatsapp={settings.whatsapp}
        />

        <HowItWorks />

        <CustomerTestimonials />

        <ReferralProgramSection
          goal={settings.goal}
          onStartRegistration={() => setIsRegisterOpen(true)}
          onOpenClientPortal={() => setIsClientPortalOpen(true)}
        />

        <FAQ settings={settings} />
      </main>

      {/* Footer */}
      <Footer
        onOpenOwnerPortal={() => setIsOwnerDashboardOpen(true)}
        onOpenClientPortal={() => setIsClientPortalOpen(true)}
      />

      {/* Interactive Modals */}
      <ClientRegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        settings={settings}
        initialSize={selectedSize}
        initialType={selectedType}
        initialReferralCode={initialReferralCode}
        onSuccess={handleRegistrationSuccess}
      />

      <ClientPortal
        isOpen={isClientPortalOpen}
        onClose={() => setIsClientPortalOpen(false)}
        settings={settings}
        activeClientCode={activeClient?.code}
        isAdminSession={isAdminClientSession}
        onLoginSuccess={(c) => {
          setIsAdminClientSession(false);
          handleClientLogin(c);
        }}
        onLogout={() => {
          setIsAdminClientSession(false);
          handleClientLogout();
        }}
        onOpenRegister={() => setIsRegisterOpen(true)}
        onReturnToOwner={handleReturnToOwner}
      />

      <OwnerDashboard
        isOpen={isOwnerDashboardOpen}
        onClose={() => setIsOwnerDashboardOpen(false)}
        settings={settings}
        onSettingsUpdated={setSettings}
        onImpersonateClient={handleImpersonateClient}
      />

      {/* Offline Connectivity Notification */}
      <OfflineIndicator />
    </div>
  );
}
