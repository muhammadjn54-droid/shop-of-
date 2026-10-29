import type { Product, ProductImage } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/+$/, '');

const normalizeUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }
  const clean = url.startsWith('/') ? url : `/${url}`;
  return `${API_BASE}${clean}`;
};

/**
 * Product photo gallery.
 *
 * Source of truth is the BACKEND (product.image + product.images), so the
 * gallery is identical on every device (phone, tablet, another computer).
 */
export const getProductGallery = (
  product?: Product | Array<string | ProductImage> | null
): string[] => {
  if (!product) return [];

  // Allow passing an array of URLs directly
  if (Array.isArray(product)) {
    return (product as Array<string | ProductImage>)
      .map((item) => (typeof item === 'string' ? item : item?.image))
      .filter((url): url is string => Boolean(url))
      .map(normalizeUrl);
  }

  const list: string[] = [];

  if (product.image) {
    list.push(normalizeUrl(product.image));
  }

  if (Array.isArray(product.images)) {
    product.images.forEach((imgObj) => {
      const url = typeof imgObj === 'string' ? imgObj : imgObj?.image;
      if (url) {
        const fullUrl = normalizeUrl(url);
        if (!list.includes(fullUrl)) {
          list.push(fullUrl);
        }
      }
    });
  }

  return list;
};

export const getProductImage = (
  product?: Product | null
): string => getProductGallery(product)[0] || '';

export default getProductGallery;
