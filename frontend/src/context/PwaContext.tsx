import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface PwaContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isModalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
  installApp: () => Promise<void>;
  markAsInstalled: () => void;
}

const PwaContext = createContext<PwaContextType | undefined>(undefined);

export const PwaProvider = ({ children }: { children: ReactNode }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true);
    const stored = localStorage.getItem('excel_pro_installed') === 'true';
    return isStandalone || stored;
  });
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  useEffect(() => {
    // Check display mode
    const checkDisplayMode = () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        ('standalone' in window.navigator && (window.navigator as unknown as { standalone: boolean }).standalone === true);
      const stored = localStorage.getItem('excel_pro_installed') === 'true';
      if (isStandalone || stored) {
        setIsInstalled(true);
      }
    };

    checkDisplayMode();

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setIsInstalled(true);
        localStorage.setItem('excel_pro_installed', 'true');
      }
    };

    mediaQuery.addEventListener('change', handleDisplayChange);

    // Capture standard PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    // Detect when user successfully installs the app
    const handleAppInstalled = () => {
      setIsInstalled(true);
      localStorage.setItem('excel_pro_installed', 'true');
      setDeferredPrompt(null);
      setIsModalOpen(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener('change', handleDisplayChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          localStorage.setItem('excel_pro_installed', 'true');
          setDeferredPrompt(null);
          setIsInstalled(true);
          setIsModalOpen(false);
        }
      } catch (err) {
        console.error('PWA install error:', err);
        setIsModalOpen(true);
      }
    } else {
      // If native prompt is not ready or already installed or browser doesn't support automatic prompt,
      // show clean instructions modal for PC, Android, and iOS
      setIsModalOpen(true);
    }
  };

  const markAsInstalled = () => {
    localStorage.setItem('excel_pro_installed', 'true');
    setIsInstalled(true);
    setIsModalOpen(false);
  };

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <PwaContext.Provider
      value={{
        isInstallable: !isInstalled,
        isInstalled,
        isModalOpen,
        openModal,
        closeModal,
        installApp,
        markAsInstalled,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
};

export const usePwa = (): PwaContextType => {
  const context = useContext(PwaContext);
  if (!context) {
    throw new Error('usePwa must be used within a PwaProvider');
  }
  return context;
};
