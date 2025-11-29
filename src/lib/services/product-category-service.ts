/**
 * Product Category Service
 * Manages product categories (Global for User)
 */

import { categoriesApi } from '@/lib/api/categories.api';
import { ProductCategory, ProductCategoryFormData, CategoryProduct } from '@/types';

/**
 * Fetch all product categories (Global)
 */
export async function fetchProductCategories(companyId?: string): Promise<ProductCategory[]> {
  try {
    // companyId is ignored as categories are now global
    return await categoriesApi.getAll();
  } catch (error) {
    console.error('Error fetching product categories:', error);
    throw error;
  }
}

/**
 * Create a new product category
 */
export async function createProductCategory(
  companyId: string, // Kept for compatibility but ignored
  data: ProductCategoryFormData
): Promise<string> {
  try {
    const category = await categoriesApi.create({
      categoryName: data.categoryName,
      description: data.description || '',
      products: data.products || [],
      defaultGstRate: data.defaultGstRate,
    });

    console.log('✅ Created product category:', category.id);
    return category.id!;
  } catch (error) {
    console.error('Error creating product category:', error);
    throw error;
  }
}

/**
 * Update an existing product category
 */
export async function updateProductCategory(
  companyId: string, // Kept for compatibility but ignored
  id: string,
  data: ProductCategoryFormData
): Promise<void> {
  try {
    await categoriesApi.update(id, {
      categoryName: data.categoryName,
      description: data.description || '',
      products: data.products || [],
      defaultGstRate: data.defaultGstRate,
    });

    console.log('✅ Updated product category:', id);
  } catch (error) {
    console.error('Error updating product category:', error);
    throw error;
  }
}

/**
 * Delete a product category
 */
export async function deleteProductCategory(companyId: string, id: string): Promise<void> {
  try {
    await categoriesApi.delete(id);
    console.log('✅ Deleted product category:', id);
  } catch (error) {
    console.error('Error deleting product category:', error);
    throw error;
  }
}

/**
 * Find category by HSN code
 * Returns the category and matched product if found
 */
export async function findCategoryByHSN(companyId: string | undefined, hsn: string): Promise<{
  category: ProductCategory;
  product: CategoryProduct;
} | null> {
  try {
    const categories = await fetchProductCategories(companyId);

    for (const category of categories) {
      const matchedProduct = category.products?.find(
        (p) => p.hsn.toLowerCase() === hsn.toLowerCase()
      );

      if (matchedProduct) {
        return { category, product: matchedProduct };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding category by HSN:', error);
    return null;
  }
}

/**
 * Find category by product name
 * Returns the category and matched product if found
 */
export async function findCategoryByProductName(companyId: string | undefined, name: string): Promise<{
  category: ProductCategory;
  product: CategoryProduct;
} | null> {
  try {
    const categories = await fetchProductCategories(companyId);
    const searchName = name.toLowerCase().trim();

    for (const category of categories) {
      const matchedProduct = category.products?.find(
        (p) => p.name.toLowerCase().trim() === searchName
      );

      if (matchedProduct) {
        return { category, product: matchedProduct };
      }
    }

    return null;
  } catch (error) {
    console.error('Error finding category by product name:', error);
    return null;
  }
}

/**
 * Get suggested GST rate based on HSN or product name
 * Returns the GST rate if a matching category is found, otherwise null
 */
export async function getSuggestedGSTRate(
  companyId: string | undefined,
  hsn?: string,
  productName?: string
): Promise<number | null> {
  try {
    // Try to find by HSN first
    if (hsn) {
      const hsnMatch = await findCategoryByHSN(companyId, hsn);
      if (hsnMatch) {
        console.log('✅ Found GST rate by HSN:', hsnMatch.category.defaultGstRate);
        return hsnMatch.category.defaultGstRate;
      }
    }

    // Try to find by product name
    if (productName) {
      const nameMatch = await findCategoryByProductName(companyId, productName);
      if (nameMatch) {
        console.log('✅ Found GST rate by product name:', nameMatch.category.defaultGstRate);
        return nameMatch.category.defaultGstRate;
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting suggested GST rate:', error);
    return null;
  }
}
