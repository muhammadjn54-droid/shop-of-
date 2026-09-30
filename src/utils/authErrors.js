/**
 * Helpers for turning backend auth errors into readable messages.
 *
 * The backend reports the same field (`email`) for two very different
 * situations, so the raw text has to be classified before it is shown:
 *  - "пользователь с таким email уже существует." / "Этот email уже занят"
 *  - "Введите правильный адрес электронной почты."
 */

const EMAIL_TAKEN_PATTERNS = [
  'уже существует',
  'уже занят',
  'уже зарегистрирован',
  'уже используется',
  'already exists',
  'already taken',
  'is taken',
];

export const firstErrorMessage = (value) => {
  if (Array.isArray(value)) return value[0] ?? '';
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') return firstErrorMessage(Object.values(value)[0]);
  return '';
};

export const isEmailTakenMessage = (message) => {
  if (typeof message !== 'string') return false;
  const lower = message.toLowerCase();
  return EMAIL_TAKEN_PATTERNS.some((pattern) => lower.includes(pattern));
};

export const emailTakenMessage = (email) =>
  email
    ? `Аккаунт с email «${email}» уже существует. Войдите в него или укажите другой адрес.`
    : 'Аккаунт с таким email уже существует. Войдите в него или укажите другой адрес.';

/**
 * Short human-readable text for the register error toast.
 * The page itself renders a more detailed, field-specific message inline.
 */
export const formatRegisterError = (err) => {
  const resData = err?.response?.data;
  if (!resData || typeof resData !== 'object') {
    return 'Ошибка при регистрации';
  }

  if (resData.username) {
    return 'Этот логин уже занят. Придумайте другой.';
  }

  if (resData.email) {
    const serverMsg = firstErrorMessage(resData.email);
    return isEmailTakenMessage(serverMsg) ? emailTakenMessage() : 'Некорректный адрес электронной почты';
  }

  const fallback = resData.non_field_errors ?? resData.detail;
  return firstErrorMessage(fallback) || 'Ошибка при регистрации';
};