-- Migration: Add storefront visibility toggle for products
-- Description: Allows controlling which products appear in the public storefront
-- Created: 2025-12-13

-- Add column mostrar_en_storefront to joyas table
ALTER TABLE joyas 
ADD COLUMN IF NOT EXISTS mostrar_en_storefront BOOLEAN DEFAULT true;

-- Update existing products to show in storefront by default
UPDATE joyas 
SET mostrar_en_storefront = true 
WHERE mostrar_en_storefront IS NULL;

-- Create index for better query performance
-- This index is partial to only include active products that could be shown
CREATE INDEX IF NOT EXISTS idx_joyas_storefront 
ON joyas(mostrar_en_storefront) 
WHERE estado = 'Activo';

-- Add column comment for documentation
COMMENT ON COLUMN joyas.mostrar_en_storefront IS 
'Indica si el producto debe mostrarse en la tienda online pública (storefront). Default: true';
