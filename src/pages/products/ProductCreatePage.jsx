import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { createProduct } from '../../api/products';
import {
  ArrowLeft,
  Upload,
  Calendar,
  Package,
  DollarSign,
  Loader2,
  Check,
  X,
  FileSpreadsheet,
  AlertCircle,
  Plus,
  Image as ImageIcon,
  Barcode,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatErrorMessage } from '../../components/common/ErrorState';

export const ProductCreatePage = () => {
  const navigate = useNavigate();

  const today = new Date().toISOString().split('T')[0];

  const [name, setName] = useState('');
  const [barcode, setBarcode] = useState('');
  const [arrivalDate, setArrivalDate] = useState(today);
  const [quantityReceived, setQuantityReceived] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');

  // Multiple images state
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isVercelMediaError, setIsVercelMediaError] = useState(false);

  // Handle multiple images selection
  const handleImagesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Generate previews
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreviews((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });

    setIsVercelMediaError(false);
  };

  const handleRemoveImageIndex = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
    setIsVercelMediaError(false);
  };

  const executeSave = async (filesToSend) => {
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
    if (!quantityReceived || parseInt(quantityReceived, 10) < 0) {
      setError('Укажите корректное количество поступившего товара');
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

    setLoading(true);

    try {
      let createdProduct;

      if (filesToSend && filesToSend.length > 0) {
        // Send ALL photos to the backend (key "images") so every device sees them
        const formData = new FormData();
        formData.append('name', name.trim());
        formData.append('barcode', barcode.trim());
        formData.append('arrival_date', arrivalDate);
        formData.append('quantity_received', parseInt(quantityReceived, 10));
        formData.append('purchase_price', purchasePrice);
        formData.append('selling_price', sellingPrice);
        filesToSend.forEach((file) => formData.append('images', file));

        createdProduct = await createProduct(formData);
      } else {
        // Send pure JSON payload without image
        createdProduct = await createProduct({
          name: name.trim(),
          barcode: barcode.trim(),
          arrival_date: arrivalDate,
          quantity_received: parseInt(quantityReceived, 10),
          purchase_price: purchasePrice,
          selling_price: sellingPrice,
        });
      }

      // Photos are stored on the backend, no local cache needed
      toast.success('Товар успешно добавлен!');
      navigate('/products');
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      // Handle Vercel 500 read-only filesystem crash on image upload
      if (
        status === 500 ||
        (typeof data === 'string' && (data.includes('500') || data.includes('<!doctype') || data.includes('<!DOCTYPE')))
      ) {
        setIsVercelMediaError(true);
        setError(
          'Сервер Vercel не смог сохранить файл изображения на диск (ошибка 500). Нажмите кнопку ниже, чтобы сохранить товар без фото.'
        );
      } else {
        const msg = formatErrorMessage(err);
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    executeSave(imageFiles);
  };

  const handleSaveWithoutImage = () => {
    handleClearAllImages();
    executeSave([]);
  };

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
            <h1 className="text-sm font-bold text-[#1e293b]">Добавить новый товар</h1>
            <p className="text-[11px] text-[#64748b]">
              Заполните параметры партии для постановки на баланс склада
            </p>
          </div>
        </div>
      </div>

      {/* Main Form Card */}
      <div className="bg-white border border-[#cbd5e1] rounded-md shadow-2xs overflow-hidden">
        <div className="bg-[#f8fafc] border-b border-[#e2e8f0] px-4 py-2.5 flex items-center gap-2 text-xs font-semibold text-[#1e293b]">
          <FileSpreadsheet className="w-4 h-4 text-[#107c41]" />
          <span>Форма поступления товара</span>
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
                    disabled={loading}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#107c41] hover:bg-[#0d6936] text-white font-medium rounded text-xs transition-colors shadow-2xs"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Сохранить товар без фото</span>
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
              placeholder="Например: дафтар"
              className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41] transition-all"
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

          {/* Grid row: Date & Quantity */}
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
                  placeholder="0"
                  className="w-full pl-9 pr-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
                />
              </div>
            </div>
          </div>

          {/* Grid row: Purchase & Selling Price */}
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
                placeholder="0.00"
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
              />
              <p className="text-[10px] text-[#64748b] mt-0.5">
                Себестоимость приобретения единицы товара
              </p>
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
                placeholder="0.00"
                className="w-full px-3 py-2 border border-[#cbd5e1] rounded text-xs text-[#1e293b] focus:outline-none focus:border-[#107c41] focus:ring-1 focus:ring-[#107c41]"
              />
              <p className="text-[10px] text-[#64748b] mt-0.5">
                Стандартная розничная цена для клиентов
              </p>
            </div>
          </div>

          {/* Multiple Images Upload Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-medium text-[#334155] flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-[#107c41]" />
                <span>Фотографии товара (несколько фото)</span>
                <span className="text-[#94a3b8] font-normal">(необязательно)</span>
              </label>
              {imagePreviews.length > 0 && (
                <span className="text-[10px] font-semibold text-[#107c41] bg-[#f0fdf4] px-2 py-0.5 rounded border border-[#bbf7d0]">
                  Выбрано фото: {imagePreviews.length} шт.
                </span>
              )}
            </div>

            {/* Previews Grid */}
            {imagePreviews.length > 0 ? (
              <div className="space-y-2 p-3 border border-[#cbd5e1] rounded bg-[#f8fafc]">
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {imagePreviews.map((src, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded border border-[#cbd5e1] bg-white overflow-hidden aspect-square"
                    >
                      <img
                        src={src}
                        alt={`Фото ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {idx === 0 && (
                        <div className="absolute top-1 left-1 bg-[#107c41] text-white text-[8px] font-bold px-1 py-0.2 rounded shadow-xs">
                          Главное
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveImageIndex(idx)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-600/90 text-white flex items-center justify-center hover:bg-red-700 transition-colors shadow-xs"
                        title="Удалить это фото"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  {/* Add more button */}
                  <label className="border-2 border-dashed border-[#cbd5e1] hover:border-[#107c41] rounded aspect-square flex flex-col items-center justify-center cursor-pointer bg-white hover:bg-[#f1f5f9] transition-all text-center">
                    <Plus className="w-5 h-5 text-[#64748b] mb-0.5" />
                    <span className="text-[10px] text-[#475569] font-medium">+ Ещё фото</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImagesChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleClearAllImages}
                    className="text-[11px] text-red-600 hover:text-red-700 font-medium hover:underline"
                  >
                    Очистить все фото
                  </button>
                </div>
              </div>
            ) : (
              <label className="border-2 border-dashed border-[#cbd5e1] hover:border-[#107c41] rounded-md p-4 flex flex-col items-center justify-center cursor-pointer bg-[#f8fafc] hover:bg-white transition-all text-center group">
                <Upload className="w-6 h-6 text-[#94a3b8] group-hover:text-[#107c41] mb-1 transition-colors" />
                <span className="text-xs font-medium text-[#334155]">
                  Выберите одно или сразу несколько фото товара
                </span>
                <span className="text-[10px] text-[#64748b] mt-0.5">
                  Поддерживается множественный выбор (multiple): JPG, PNG, WEBP
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImagesChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

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
              disabled={loading}
              className="px-5 py-2 rounded bg-[#107c41] hover:bg-[#0d6936] text-white font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-xs"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Сохранение...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Сохранить товар</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductCreatePage;
