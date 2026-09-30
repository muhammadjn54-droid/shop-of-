import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router';
import { getProduct, updateProduct } from '../../api/products';
import {
  ArrowLeft,
  Upload,
  Calendar,
  Package,
  Loader2,
  Check,
  X,
  FileSpreadsheet,
  Lock,
  AlertCircle,
  Plus,
  Image as ImageIcon,
  Barcode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatMoney } from '../../utils/formatters';
import { formatErrorMessage } from '../../components/common/ErrorState';
import { getProductGallery } from '../../utils/productGallery';

export const ProductEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loadingProduct, setLoadingProduct] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [isVercelMediaError, setIsVercelMediaError] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [quantityReceived, setQuantityReceived] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  // Multiple Image states
  const [currentImages, setCurrentImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);

  // Read-only calculated fields from backend
  const [calculatedData, setCalculatedData] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoadingProduct(true);
      setError(null);
      try {
        const data = await getProduct(id);
        setName(data.name || '');
        setBarcode(data.barcode || '');
        setArrivalDate(data.arrival_date || '');
        setQuantityReceived(data.quantity_received?.toString() || '');
        setPurchasePrice(data.purchase_price || '');
        setSellingPrice(data.selling_price || '');

        // Load existing gallery
        const existingList = getProductGallery(data);
        setCurrentImages(existingList);

        setCalculatedData({
          quantity_sold: data.quantity_sold,
          remaining_quantity: data.remaining_quantity,
          revenue: data.revenue,
          sold_cost: data.sold_cost,
          profit: data.profit,
          loss: data.loss,
          profit_per_item: data.profit_per_item,
        });
      } catch (err) {
        const msg = formatErrorMessage(err);
        setError(msg);
        toast.error('Не удалось загрузить данные товара');
      } finally {
        setLoadingProduct(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setNewImageFiles((prev) => [...prev, ...files]);

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewImagePreviews((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });

    setIsVercelMediaError(false);
  };

  const handleRemoveNewImageIndex = (index) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearNewImages = () => {
    setNewImageFiles([]);
    setNewImagePreviews([]);
    setIsVercelMediaError(false);
  };

  const executeUpdate = async (filesToUpload) => {
    setError(null);
    setIsVercelMediaError(false);

    if (!name.trim()) {
      setError('Укажите название товара');
      return;
    }
    if (!arrivalDate) {
      setError('Укажите дату поступления');
      return;
    }
    if (quantityReceived === '' || parseInt(quantityReceived, 10) < 0) {
      setError('Укажите корректное количество');
      return;
    }
    if (!purchasePrice || parseFloat(purchasePrice) <= 0) {
      setError('Укажите корректную закупочную цену');
      return;
    }
    if (!sellingPrice || parseFloat(sellingPrice) <= 0) {
      setError('Укажите корректную цену продажи');
      return;
    }

    setSaving(true);

    try {
      let updatedProduct;
      if (filesToUpload && filesToUpload.length > 0) {
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('barcode', barcode.trim());
        formData.append('arrival_date', arrivalDate);
        formData.append('quantity_received', parseInt(quantityReceived, 10));
        formData.append('purchase_price', purchasePrice);
        formData.append('selling_price', sellingPrice);
        filesToUpload.forEach((file) => formData.append('images', file));

        updatedProduct = await updateProduct(id, formData);
      } else {
        updatedProduct = await updateProduct(id, {
          name: name.trim(),
          barcode: barcode.trim(),
          arrival_date: arrivalDate,
          quantity_received: parseInt(quantityReceived, 10),
          purchase_price: purchasePrice,
          selling_price: sellingPrice,
        });
      }

      // Photos are stored on the backend, no local cache needed
      toast.success('Товар успешно изменён');
      navigate('/products');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (
        status === 500 ||
        (typeof data === 'string' && (data.includes('500') || data.includes('<!doctype') || data.includes('<!DOCTYPE')))
      ) {
        setIsVercelMediaError(true);
        setError(
          'Сервер Vercel не смог сохранить файл изображения (ошибка 500). Нажмите кнопку ниже для сохранения без фото.'
        );
      } else {
        const msg = formatErrorMessage(err);
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeUpdate(newImageFiles);
  };

  const handleSaveWithoutImage = () => {
    handleClearNewImages();
    executeUpdate([]);
  };

  if (loadingProduct) {
    return (
      <div className="max-w-3xl mx-auto py-12 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-[#107c41]" />
        <span className="text-xs text-[#64748b]">Загрузка параметров товара #{id}...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto w-full space-y-4 font-['Inter',sans-serif]">
      {/* Back button & Title */}
      <div className="flex items-center justify-between bg-white border border-[#cbd5e1] p-3 rounded-md shadow-2xs">
        <div className="flex items-center gap-2">
          <Link
            to="/products"
            className="p-1.5 rounded hover:bg-[#f1f5f9] text-[#475569] transition-colors"
            title="Назад к списку товаров"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-[#1e293b]">Редактирование товара #{id}</h1>
            <p className="text-[11px] text-[#64748b]">
              Изменение параметров партии (расчётные показатели рассчитываются сервером)
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs overflow-hidden">
        <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2.5 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 font-semibold text-[#1e293b]">
            <FileSpreadsheet className="w-4 h-4 text-[#107c41]" />
            <span>Параметры номенклатуры</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-xs space-y-2">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="flex-1">{error}</span>
              </div>
              {isVercelMediaError && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleSaveWithoutImage}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#107c41] hover:bg-[#0d6936] text-white font-medium rounded text-xs transition-colors shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Сохранить без нового фото</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Название товара <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
            />
          </div>

          {/* Barcode */}
          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Штрихкод
            </label>
            <div className="relative flex items-center">
              <Barcode className="absolute left-3 w-4 h-4 text-[#94a3b8] pointer-events-none" />
              <input
                type="text"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                placeholder="Например: CH0000034936"
                className="w-full pl-9 pr-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] placeholder-[#94a3b8] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
              />
            </div>
            <p className="text-[10px] text-[#64748b] mt-0.5">
              Можно ввести вручную или отсканировать. Уникален в пределах вашего аккаунта
            </p>
          </div>

          {/* Date & Quantity Received */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Дата поступления <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Calendar className="absolute left-3 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                <input
                  type="date"
                  value={arrivalDate}
                  onChange={(e) => setArrivalDate(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Количество поступило (шт.) <span className="text-red-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Package className="absolute left-3 w-4 h-4 text-[#94a3b8] pointer-events-none" />
                <input
                  type="number"
                  min="0"
                  value={quantityReceived}
                  onChange={(e) => setQuantityReceived(e.target.value)}
                  required
                  className="w-full pl-9 pr-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
                />
              </div>
            </div>
          </div>

          {/* Purchase & Selling Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Закупочная цена за 1 шт. (сомони) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
              />
            </div>

            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Цена продажи за 1 шт. (сомони) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                required
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
              />
            </div>
          </div>

          {/* Multiple Image Upload / Gallery */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-[#334155] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#107c41]" />
                <span>Фотографии товара (множественный выбор)</span>
              </label>
            </div>

            {/* Existing photos preview */}
            {currentImages.length > 0 && newImagePreviews.length === 0 && (
              <div className="p-3 mb-2 border border-[#cbd5e1] rounded bg-[#f8fafc]">
                <p className="text-[11px] font-medium text-[#475569] mb-2">
                  Текущие фото товара ({currentImages.length} шт.):
                </p>
                <div className="flex flex-wrap gap-2">
                  {currentImages.map((src, idx) => (
                    <div key={idx} className="w-16 h-16 rounded border border-[#cbd5e1] bg-white overflow-hidden">
                      <img src={src} alt="Текущее фото" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New selected images */}
            {newImagePreviews.length > 0 ? (
              <div className="space-y-2 p-3 border border-[#cbd5e1] rounded bg-[#f8fafc]">
                <p className="text-[11px] font-medium text-[#107c41]">
                  Новые выбранные фото ({newImagePreviews.length} шт.):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {newImagePreviews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative rounded border border-[#cbd5e1] bg-white overflow-hidden aspect-square"
                    >
                      <img src={src} alt={`Новое фото ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveNewImageIndex(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-xs"
                        title="Удалить это фото"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="border-2 border-dashed border-[#cbd5e1] hover:border-[#107c41] rounded aspect-square flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-[#f1f5f9] transition-all text-center">
                    <Plus className="w-5 h-5 text-[#64748b] mb-0.5" />
                    <span className="text-[10px] text-[#475569] font-medium">+ Ещё фото</span>
                    <input type="file" multiple accept="image/*" onChange={handleImagesChange} className="hidden" />
                  </label>
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleClearNewImages}
                    className="text-[11px] text-red-600 hover:text-red-700 font-medium hover:underline"
                  >
                    Отменить новые фото
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#cbd5e1] hover:border-[#107c41] rounded-md p-4 flex flex-col items-center justify-center cursor-pointer bg-[#f8fafc] hover:bg-white transition-all text-center group">
                <Upload className="w-5 h-5 text-[#94a3b8] group-hover:text-[#107c41] mb-1" />
                <span className="text-xs font-medium text-[#334155]">Добавить или заменить фотографии (multiple)</span>
                <input type="file" multiple accept="image/*" onChange={handleImagesChange} className="hidden" />
              </label>
            )}
          </div>

          {/* Read-Only System Fields */}
          {calculatedData && (
            <div className="pt-2 border-t border-[#e2e8f0]">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#64748b] uppercase tracking-wider mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Автоматически рассчитываемые сервером поля (только чтение)</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#f8fafc] p-3 border border-[#e2e8f0] rounded">
                <div>
                  <span className="text-[10px] text-[#64748b] block">Продано:</span>
                  <span className="text-xs font-semibold text-[#1e293b]">
                    {calculatedData.quantity_sold} шт.
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] block">Осталось:</span>
                  <span className="text-xs font-semibold text-[#107c41]">
                    {calculatedData.remaining_quantity} шт.
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] block">Выручка:</span>
                  <span className="text-xs font-semibold text-[#0369a1]">
                    {formatMoney(calculatedData.revenue)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#64748b] block">Прибыль:</span>
                  <span className="text-xs font-semibold text-[#15803d]">
                    {formatMoney(calculatedData.profit)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-end gap-2.5">
            <Link
              to="/products"
              className="px-4 py-2 rounded border border-[#cbd5e1] bg-white hover:bg-[#f1f5f9] text-[#475569] font-medium transition-colors"
            >
              Отмена
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded bg-[#107c41] hover:bg-[#0d6936] text-white font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Сохранить изменения</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductEditPage;
