/**
 * Image Zoom Component
 * 
 * Advanced image viewer with zoom functionality for product images.
 * Features:
 * - Hover magnifier on desktop
 * - Click to open fullscreen modal
 * - Pinch-to-zoom on mobile
 * - Smooth animations with framer-motion
 * - Keyboard navigation (ESC to close)
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import type { ImageZoomProps } from '@/lib/types';

export function ImageZoom({
  src,
  alt,
  highResSrc,
  className = '',
  priority = false,
}: ImageZoomProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Detect touch device on client side only
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isModalOpen]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || isTouchDevice) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setMousePosition({ x, y });
  };

  const handleMouseEnter = () => {
    if (!isTouchDevice) {
      setIsHovering(true);
    }
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handleClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // Use high-res image for modal if provided, otherwise use main src
  const modalSrc = highResSrc || src;

  return (
    <>
      {/* Main Image Container */}
      <div
        ref={imageRef}
        className={`relative group cursor-zoom-in ${className}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label="Haz clic para ampliar imagen"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 1024px) 100vw, 50vw"
          className="object-cover"
          priority={priority}
          unoptimized
        />

        {/* Zoom Indicator - Desktop Only */}
        {!isTouchDevice && (
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
              <svg
                className="w-6 h-6 text-primary-900"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Hover Magnifier Effect - Desktop Only */}
        {!isTouchDevice && isHovering && (
          <div
            className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            style={{
              backgroundImage: `url(${modalSrc})`,
              backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
              backgroundSize: '300%',
              backgroundRepeat: 'no-repeat',
            }}
          />
        )}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={handleCloseModal}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100]"
              aria-hidden="true"
            />

            {/* Modal Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-[101] flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-label="Vista ampliada de imagen"
            >
              {/* Close Button */}
              <button
                onClick={handleCloseModal}
                className="absolute top-4 right-4 md:top-8 md:right-8 z-10 p-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors"
                aria-label="Cerrar vista ampliada"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              {/* Image Container with Touch Zoom Support */}
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="relative max-w-7xl max-h-full aspect-square w-full">
                  <Image
                    src={modalSrc}
                    alt={alt}
                    fill
                    sizes="100vw"
                    className="object-contain"
                    priority
                    unoptimized
                  />
                </div>
              </div>

              {/* Instruction Text */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm text-center">
                {isTouchDevice ? (
                  <span>Pellizca para hacer zoom</span>
                ) : (
                  <span>Presiona ESC para cerrar</span>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default ImageZoom;
