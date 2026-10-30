import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';

const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim();
const GSI_SRC = 'https://accounts.google.com/gsi/client';

interface GoogleId {
  initialize: (cfg: { client_id: string; callback: (r: { credential: string }) => void }) => void;
  renderButton: (el: HTMLElement, opts: Record<string, unknown>) => void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

let scriptPromise: Promise<void> | null = null;
const loadGsi = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = GSI_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null;
        reject(new Error('Google script failed to load'));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
};

interface GoogleButtonProps {
  text: 'signin_with' | 'signup_with';
  onCredential: (credential: string) => void | Promise<void>;
}

const GoogleLogo = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
    <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 0 1 0-9.4l-7.9-6.1a24 24 0 0 0 0 21.6l7.9-6.1z" />
    <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.5-5.8c-2.1 1.4-4.8 2.3-8.1 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
  </svg>
);

/** Google Identity Services button. Without a client ID it stays visible and explains what to set up. */
export const GoogleButton = ({ text, onCredential }: GoogleButtonProps) => {
  const { theme } = useTheme();
  const holder = useRef<HTMLDivElement>(null);
  const cb = useRef(onCredential);
  cb.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        if (cancelled || !holder.current || !window.google) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (r) => void cb.current(r.credential),
        });
        holder.current.innerHTML = '';
        window.google.accounts.id.renderButton(holder.current, {
          type: 'standard',
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          text,
          shape: 'rectangular',
          width: Math.min(holder.current.offsetWidth || 336, 400),
        });
      })
      .catch(() => setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [text, theme]);

  if (CLIENT_ID && !failed) {
    return <div ref={holder} className="flex justify-center min-h-[44px]" />;
  }

  const label = text === 'signup_with' ? 'Зарегистрироваться через Google' : 'Войти через Google';
  return (
    <button
      type="button"
      onClick={() =>
        toast.error(
          failed
            ? 'Не удалось загрузить Google. Проверьте интернет.'
            : 'Вход через Google ещё не настроен: добавьте VITE_GOOGLE_CLIENT_ID.'
        )
      }
      className="w-full h-[50px] rounded-xl border border-[#d5dbd3] dark:border-[#26382f] bg-white dark:bg-[#0f1c17] text-[14px] font-semibold flex items-center justify-center gap-3 hover:bg-[#f7f9f6] dark:hover:bg-[#16251f]"
    >
      <GoogleLogo />
      <span>{label}</span>
    </button>
  );
};
