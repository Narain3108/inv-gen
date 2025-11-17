/**
 * Product Category Service
 * Manages global product categories (accessible by all companies)
 */

import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ProductCategory, ProductCategoryFormData, CategoryProduct } from '@/types';

const COLLECTION_NAME = 'productCategories';

/**
 * Fetch all product categories (global, accessible by all companies)
 */
export async function fetchProductCategories(): Promise<ProductCategory[]> {
  try {
    const q = query(collection(db, COLLECTION_NAME), orderBy('categoryName', 'asc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as ProductCategory[];
  } catch (error) {
    console.error('Error fetching product categories:', error);
    throw error;
  }
}

/**
 * Create a new product category
 */
export async function createProductCategory(
  data: ProductCategoryFormData
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      categoryName: data.categoryName,
      description: data.description || '',
      products: data.products || [],
      defaultGstRate: data.defaultGstRate,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Created product category:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error creating product category:', error);
    throw error;
  }
}

/**
 * Update an existing product category
 */
export async function updateProductCategory(
  id: string,
  data: ProductCategoryFormData
): Promise<void> {
  try {
    const categoryRef = doc(db, COLLECTION_NAME, id);
    await updateDoc(categoryRef, {
      categoryName: data.categoryName,
      description: data.description || '',
      products: data.products || [],
      defaultGstRate: data.defaultGstRate,
      updatedAt: serverTimestamp(),
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
export async function deleteProductCategory(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
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
export async function findCategoryByHSN(hsn: string): Promise<{
  category: ProductCategory;
  product: CategoryProduct;
} | null> {
  try {
    const categories = await fetchProductCategories();

    for (const category of categories) {
      const matchedProduct = category.products.find(
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
export async function findCategoryByProductName(name: string): Promise<{
  category: ProductCategory;
  product: CategoryProduct;
} | null> {
  try {
    const categories = await fetchProductCategories();
    const searchName = name.toLowerCase().trim();

    for (const category of categories) {
      const matchedProduct = category.products.find(
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
  hsn?: string,
  productName?: string
): Promise<number | null> {
  try {
    // Try to find by HSN first
    if (hsn) {
      const hsnMatch = await findCategoryByHSN(hsn);
      if (hsnMatch) {
        console.log('✅ Found GST rate by HSN:', hsnMatch.category.defaultGstRate);
        return hsnMatch.category.defaultGstRate;
      }
    }

    // Try to find by product name
    if (productName) {
      const nameMatch = await findCategoryByProductName(productName);
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
