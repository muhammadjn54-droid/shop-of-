import { AlertCircle, RefreshCw } from 'lucide-react';

export const formatErrorMessage = (error: unknown): string => {
  if (!error) return 'Произошла неизвестная ошибка';
  if (typeof error === 'string') {
    if (error.includes('Server Error (500)') || error.includes('<!doctype') || error.includes('<!DOCTYPE')) {
      return 'Ошибка сервера (500): на сервере Vercel не настроено сохранение файлов на диск. Пожалуйста, удалите фото и сохраните товар.';
    }
    return error;
  }

  const errObj = error as {
    message?: string;
    response?: {
      status?: number;
      data?: unknown;
    };
  };

  const status = errObj.response?.status;
  const data = errObj.response?.data;

  // Catch 500 HTML error pages from Vercel
  if (
    status === 500 ||
    (typeof data === 'string' && (data.includes('500') || data.includes('<!doctype') || data.includes('<!DOCTYPE')))
  ) {
    return 'Ошибка сервера (500): на сервере Vercel не настроено сохранение файлов на диск. Пожалуйста, нажмите ✕ на фото и сохраните товар без фото.';
  }

  if (!data) {
    return errObj.message || 'Ошибка соединения с сервером';
  }

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'object' && data !== null) {
    const dataRecord = data as Record<string, unknown>;
    if (typeof dataRecord.detail === 'string') {
      return dataRecord.detail;
    }

    const messages: string[] = [];
    Object.entries(dataRecord).forEach(([key, val]) => {
      const fieldName = key === 'non_field_errors' ? '' : `${key}: `;
      if (Array.isArray(val)) {
        messages.push(`${fieldName}${val.join(', ')}`);
      } else if (typeof val === 'string') {
        messages.push(`${fieldName}${val}`);
      } else if (typeof val === 'object' && val !== null) {
        messages.push(`${fieldName}${JSON.stringify(val)}`);
      }
    });
    if (messages.length > 0) {
      return messages.join('; ');
    }
  }

  return 'Произошла ошибка при обработке запроса';
};

export interface ErrorStateProps {
  error?: unknown;
  onRetry?: () => void;
}

export const ErrorState = ({ error, onRetry }: ErrorStateProps) => {
  const message = formatErrorMessage(error);

  return (
    <div className="w-full py-8 px-4 flex flex-col items-center justify-center text-center bg-[#fef2f2] border border-[#fecaca] rounded">
      <div className="w-10 h-10 rounded-full bg-[#fee2e2] text-[#dc2626] flex items-center justify-center mb-2.5">
        <AlertCircle className="w-5 h-5" />
      </div>
      <h3 className="text-xs font-semibold text-[#991b1b] mb-1">Не удалось загрузить данные</h3>
      <p className="text-xs text-[#b91c1c] max-w-md mb-3">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#fca5a5] hover:bg-[#fff5f5] text-[#b91c1c] text-xs font-medium rounded transition-colors shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Повторить попытку
        </button>
      )}
    </div>
  );
};

export default ErrorState;
