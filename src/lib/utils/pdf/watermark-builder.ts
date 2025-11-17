/**
 * PDF Watermark Builder
 * Creates watermark/stamp for duplicate copies
 */

/**
 * Build duplicate copy watermark (top right corner)
 */
export const buildDuplicateWatermark = (): any => {
  return {
    text: 'DUPLICATE COPY',
    fontSize: 8,
    color: '#dc2626', // red-600
    bold: true,
    alignment: 'right',
    margin: [0, 0, 0, 10], // Small bottom margin to separate from content
  };
};

/**
 * Get watermark for page header based on copy type
 */
export const getPageWatermark = (copyType?: 'original' | 'duplicate'): any[] => {
  if (copyType === 'duplicate') {
    return [buildDuplicateWatermark()];
  }
  return [];
};
