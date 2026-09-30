/**
 * Utility functions for formatting currency, numbers, and dates
 */

export const formatMoney = (amount) => {
  if (amount === null || amount === undefined || amount === '') return '0.00 сомони';
  const num = typeof amount === 'number' ? amount : parseFloat(amount);
  if (isNaN(num)) return '0.00 сомони';

  const parts = num.toFixed(2).split('.');
  const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${integerPart}.${parts[1]} сомони`;
};

export const formatDate = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  } catch {
    return dateString;
  }
};

export const formatDateTime = (dateString) => {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} ${hours}:${minutes}`;
  } catch {
    return dateString;
  }
};

export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  const val = typeof num === 'number' ? num : parseInt(num, 10);
  if (isNaN(val)) return '0';
  return val.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};
