import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Package, Image as ImageIcon } from 'lucide-react';

export const ImageSwiper = ({ images = [], alt = 'Фото товара', className = '' }) => {
  // Normalize images: filter out falsy values
  const list = Array.isArray(images)
    ? images.filter(Boolean)
    : images
    ? [images]
    : [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-swipe effect every 3.5 seconds
  useEffect(() => {
    if (list.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % list.length);
    }, 3500);

    return () => clearInterval(timer);
  }, [list.length, isPaused]);

  if (list.length === 0) {
    return (
      <div
        className={`w-28 h-28 sm:w-32 sm:h-32 rounded bg-[#e2e8f0] text-[#94a3b8] flex flex-col items-center justify-center border border-[#cbd5e1] shrink-0 ${className}`}
      >
        <Package className="w-8 h-8 mb-1" />
        <span className="text-[10px]">Нет фото</span>
      </div>
    );
  }

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? list.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % list.length);
  };

  return (
    <div
      className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded border border-[#cbd5e1] bg-white overflow-hidden shrink-0 group select-none ${className}`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Current Slide Image */}
      <img
        src={list[currentIndex]}
        alt={`${alt} - ${currentIndex + 1}`}
        className="w-full h-full object-cover transition-opacity duration-300"
      />

      {/* Multiple Photos Controls (only if > 1 image) */}
      {list.length > 1 && (
        <>
          {/* Badge: e.g. 1 / 3 */}
          <div className="absolute top-1 right-1 bg-black/60 backdrop-blur-[2px] text-white text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
            <ImageIcon className="w-2.5 h-2.5" />
            <span>
              {currentIndex + 1}/{list.length}
            </span>
          </div>

          {/* Left Arrow */}
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-0.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/80 hover:bg-white text-[#1e293b] flex items-center justify-center shadow-xs transition-opacity opacity-0 group-hover:opacity-100"
            title="Предыдущее фото"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Right Arrow */}
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-0.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-white/80 hover:bg-white text-[#1e293b] flex items-center justify-center shadow-xs transition-opacity opacity-0 group-hover:opacity-100"
            title="Следующее фото"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Navigation Dots */}
          <div className="absolute bottom-1 inset-x-0 flex justify-center gap-1">
            {list.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? 'bg-[#107c41] w-3' : 'bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageSwiper;
