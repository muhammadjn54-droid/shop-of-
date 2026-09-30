import api from './api';

export const getProducts = async (params = {}) => {
  const cleanParams = {};
  if (params.search) cleanParams.search = params.search;
  if (params.barcode) cleanParams.barcode = params.barcode;
  if (params.ordering) cleanParams.ordering = params.ordering;
  if (params.page) cleanParams.page = params.page;

  const response = await api.get('/api/products/', { params: cleanParams });
  return response.data;
};

// Точный поиск по штрихкоду (для USB-сканера: один запрос по Enter)
export const getProductByBarcode = async (barcode) => {
  const response = await api.get('/api/products/', { params: { barcode } });
  return response.data;
};

export const getProduct = async (id) => {
  const response = await api.get(`/api/products/${id}/`);
  return response.data;
};

export const createProduct = async (productData) => {
  const isFormData = productData instanceof FormData;
  const response = await api.post('/api/products/', productData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const updateProduct = async (id, productData) => {
  const isFormData = productData instanceof FormData;
  const response = await api.patch(`/api/products/${id}/`, productData, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
  return response.data;
};

export const deleteProduct = async (id) => {
  const response = await api.delete(`/api/products/${id}/`);
  return response.data;
};

export const sellProduct = async (id, sellData) => {
  const response = await api.post(`/api/products/${id}/sell/`, sellData);
  return response.data;
};

export const addStock = async (id, stockData) => {
  const response = await api.post(`/api/products/${id}/add-stock/`, stockData);
  return response.data;
};

export const returnProduct = async (id, returnData) => {
  const response = await api.post(`/api/products/${id}/return/`, returnData);
  return response.data;
};

export const getLowStock = async (params = {}) => {
  const cleanParams = {};
  if (params.search) cleanParams.search = params.search;
  if (params.ordering) cleanParams.ordering = params.ordering;
  if (params.page) cleanParams.page = params.page;

  const response = await api.get('/api/products/low-stock/', { params: cleanParams });
  return response.data;
};

export const getProductSales = async (id, params = {}) => {
  const cleanParams = {};
  if (params.search) cleanParams.search = params.search;
  if (params.ordering) cleanParams.ordering = params.ordering;
  if (params.page) cleanParams.page = params.page;

  const response = await api.get(`/api/products/${id}/sales/`, { params: cleanParams });
  return response.data;
};

export const uploadProductImages = async (id, formData) => {
  const response = await api.post(`/api/products/${id}/images/`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const deleteProductImage = async (productId, imageId) => {
  const response = await api.delete(`/api/products/${productId}/images/${imageId}/`);
  return response.data;
};
