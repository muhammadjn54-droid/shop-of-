import type { Product, ProductImage } from '../types';

/**
 * Product photo gallery.
 *
 * Source of truth is the BACKEND (product.image + product.images), so the
 * gallery is identical on every device (phone, tablet, another computer).
 * Local storage is NOT used as a source anymore.
 */

/**
 * Builds the photo list for a product from the backend response.
 * Accepts either a product object or a raw list of image URLs.
 */
export const getProductGallery = (
  product?: Product | Array<string | ProductImage> | null
): string[] => {
  if (!product) return [];

  // Allow passing an array of URLs directly
  if (Array.isArray(product)) {
    return (product as Array<string | ProductImage>)
      .map((item) => (typeof item === 'string' ? item : item?.image))
      .filter((url): url is string => Boolean(url));
  }

  const list: string[] = [];

  if (product.image) {
    list.push(product.image);
  }

  // DRF Product.images (see Swagger: images = [{ id, image, created_at }])
  if (Array.isArray(product.images)) {
    product.images.forEach((imgObj) => {
      const url = typeof imgObj === 'string' ? imgObj : imgObj?.image;
      if (url && !list.includes(url)) {
        list.push(url);
      }
    });
  }

  return list;
};

/**
 * Kept for backward compatibility. Photos are uploaded to the backend,
 * so there is nothing to cache locally anymore.
 */
export const saveProductGallery = (): void => {};
