/**
 * Вспомогательные функции для форматирования ошибок аутентификации.
 */

const EMAIL_TAKEN_PATTERNS = [
  'уже занят',
  'уже существует',
  'already exists',
  'already taken',
  'is taken',
];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

export const firstErrorMessage = (value: unknown): string => {
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) {
    for (const item of value) {
      const message = firstErrorMessage(item);
      if (message) return message;
    }
    return '';
  }
  if (isRecord(value)) {
    for (const item of Object.values(value)) {
      const message = firstErrorMessage(item);
      if (message) return message;
    }
    return '';
  }
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return '';
};

export const isEmailTakenMessage = (message: unknown): boolean => {
  if (typeof message !== 'string') return false;
  const lower = message.toLowerCase();
  return EMAIL_TAKEN_PATTERNS.some((pattern) => lower.includes(pattern));
};

export const emailTakenMessage = (email?: string): string =>
  email
    ? `Пользователь с email "${email}" уже существует. Войдите или используйте другой адрес.`
    : 'Пользователь с таким email уже существует. Войдите или используйте другой адрес.';

/**
 * Короткий понятный текст ошибки для формы/тоста регистрации.
 */
export const formatRegisterError = (err: unknown): string => {
  const axiosErr = err as { response?: { data?: Record<string, unknown> } };
  const resData = axiosErr?.response?.data;
  if (!resData || typeof resData !== 'object') {
    return 'Не удалось зарегистрироваться. Проверьте подключение к сети.';
  }

  // NestJS error message
  if (resData.message) {
    const msg = firstErrorMessage(resData.message);
    if (msg) return msg;
  }

  if (resData.username) {
    return 'Это имя пользователя уже занято. Выберите другое.';
  }

  if (resData.email) {
    const serverMsg = firstErrorMessage(resData.email);
    return isEmailTakenMessage(serverMsg) ? emailTakenMessage() : 'Укажите корректный адрес email.';
  }

  if (resData.password) {
    return `Ошибка в пароле: ${firstErrorMessage(resData.password)}`;
  }

  const fallback = resData.non_field_errors ?? resData.detail;
  return firstErrorMessage(fallback) || 'Ошибка регистрации. Проверьте правильность заполнения полей.';
};

const WRONG_CREDENTIALS = 'Неверное имя пользователя или пароль';
const NO_CONNECTION = 'Нет связи с сервером. Проверьте интернет-соединение.';
const SERVER_DOWN = 'Сервер временно недоступен. Попробуйте чуть позже.';

/**
 * Сообщение при ошибке входа /api/auth/login/.
 */
export const formatLoginError = (err: unknown): string => {
  const axiosErr = err as { response?: { status?: number; data?: unknown } } | null;
  const response = axiosErr?.response;
  const status = response?.status;
  const data = response?.data;

  const serverMessage = isRecord(data)
    ? firstErrorMessage(data.message) ||
      firstErrorMessage(data.detail) ||
      firstErrorMessage(data.non_field_errors) ||
      firstErrorMessage(data.username) ||
      firstErrorMessage(data.password)
    : firstErrorMessage(data);

  if (serverMessage && !serverMessage.trimStart().startsWith('<')) return serverMessage;

  if (!response) return NO_CONNECTION;
  if (status === 401 || status === 403) return WRONG_CREDENTIALS;
  if (status === 429) return 'Слишком много попыток входа. Подождите пару минут.';
  if (status !== undefined && status >= 500) return SERVER_DOWN;
  return status
    ? `Ошибка сервера (код ${status}). Повторите попытку позже.`
    : 'Не удалось войти в систему. Проверьте данные.';
};
