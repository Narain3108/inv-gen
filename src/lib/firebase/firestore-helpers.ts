/**
 * Firestore Helper Functions
 * 
 * Generic CRUD operations and query helpers for Firestore with
 * comprehensive error handling and type safety.
 * 
 * @module lib/firebase/firestore-helpers
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  WhereFilterOp,
  OrderByDirection,
  DocumentData,
  QueryConstraint,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { handleFirebaseError, logError } from '@/lib/errors/error-handler';

/**
 * Get a single document by ID
 * 
 * @template T - The type of document to retrieve
 * @param collectionName - Firestore collection name
 * @param docId - Document ID
 * @returns The document data or null if not found
 * @throws {FirebaseError} If the operation fails
 */
export async function getDocument<T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as T;
    }

    return null;
  } catch (error: any) {
    logError(error, `getDocument:${collectionName}`);
    throw handleFirebaseError(error);
  }
}

/**
 * Get all documents from a collection
 * 
 * @template T - The type of documents to retrieve
 * @param collectionName - Firestore collection name
 * @param orderByField - Optional field to order by
 * @param orderDirection - Order direction (asc/desc)
 * @param maxResults - Maximum number of results
 * @returns Array of documents
 * @throws {FirebaseError} If the operation fails
 */
export async function getAllDocuments<T extends DocumentData>(
  collectionName: string,
  orderByField?: string,
  orderDirection: OrderByDirection = 'asc',
  maxResults?: number
): Promise<T[]> {
  try {
    const constraints: QueryConstraint[] = [];

    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection));
    }

    if (maxResults) {
      constraints.push(limit(maxResults));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error: any) {
    logError(error, `getAllDocuments:${collectionName}`);
    throw handleFirebaseError(error);
  }
}

/**
 * Get documents with a query filter
 * 
 * @template T - The type of documents to retrieve
 * @param collectionName - Firestore collection name
 * @param field - Field to filter by
 * @param operator - Firestore where operator
 * @param value - Value to filter by
 * @param orderByField - Optional field to order by
 * @param orderDirection - Order direction (asc/desc)
 * @param maxResults - Maximum number of results
 * @returns Array of filtered documents
 * @throws {FirebaseError} If the operation fails
 */
export async function queryDocuments<T extends DocumentData>(
  collectionName: string,
  field: string,
  operator: WhereFilterOp,
  value: unknown,
  orderByField?: string,
  orderDirection: OrderByDirection = 'asc',
  maxResults?: number
): Promise<T[]> {
  try {
    const constraints: QueryConstraint[] = [where(field, operator, value)];

    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection));
    }

    if (maxResults) {
      constraints.push(limit(maxResults));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error: any) {
    logError(error, `queryDocuments:${collectionName}`);
    throw handleFirebaseError(error);
  }
}

/**
 * Create a new document with auto-generated ID
 * 
 * @template T - The type of document to create
 * @param collectionName - Firestore collection name
 * @param data - Document data (without id, createdAt, updatedAt)
 * @returns The generated document ID
 * @throws {FirebaseError} If the operation fails
 */
export async function createDocument<T extends DocumentData>(
  collectionName: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = doc(collection(db, collectionName));
    const timestamp = serverTimestamp();

    await setDoc(docRef, {
      ...data,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return docRef.id;
  } catch (error: any) {
    logError(error, `createDocument:${collectionName}`);
    throw handleFirebaseError(error);
  }
}

/**
 * Create or overwrite a document with specific ID
 * 
 * @template T - The type of document to set
 * @param collectionName - Firestore collection name
 * @param docId - Document ID
 * @param data - Document data (without id, createdAt, updatedAt)
 * @param merge - Whether to merge with existing data
 * @throws {FirebaseError} If the operation fails
 */
export async function setDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>,
  merge: boolean = false
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    const timestamp = serverTimestamp();

    if (merge) {
      await setDoc(
        docRef,
        {
          ...data,
          updatedAt: timestamp,
        },
        { merge: true }
      );
    } else {
      await setDoc(docRef, {
        ...data,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  } catch (error: any) {
    logError(error, `setDocument:${collectionName}`);
    throw handleFirebaseError(error);
  }
}

/**
 * Update an existing document
 * 
 * @template T - The type of document to update
 * @param collectionName - Firestore collection name
 * @param docId - Document ID
 * @param data - Partial document data to update
 * @throws {FirebaseError} If the operation fails
 */
export async function updateDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error: any) {
    logError(error, `updateDocument:${collectionName}`);
    throw handleFirebaseError(error);
  }
}

/**
 * Delete a document
 * 
 * @param collectionName - Firestore collection name
 * @param docId - Document ID
 * @throws {FirebaseError} If the operation fails
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error: any) {
    logError(error, `deleteDocument:${collectionName}`);
    throw handleFirebaseError(error);
  }
}

/**
 * Get all documents (no user filtering - shared public data)
 * 
 * @template T - The type of documents to retrieve
 * @param collectionName - Firestore collection name
 * @param userId - User ID (not used in shared public app)
 * @param orderByField - Optional field to order by
 * @param orderDirection - Order direction (asc/desc)
 * @returns Array of documents
 * @throws {FirebaseError} If the operation fails
 */
export async function getUserDocuments<T extends DocumentData>(
  collectionName: string,
  userId?: string,
  orderByField?: string,
  orderDirection: OrderByDirection = 'desc'
): Promise<T[]> {
  // Shared public app - get all documents regardless of userId
  return getAllDocuments<T>(collectionName, orderByField, orderDirection);
}

/**
 * Get documents by company ID (for multi-company support)
 * 
 * @template T - The type of documents to retrieve
 * @param collectionName - Firestore collection name
 * @param companyId - Company ID to filter by
 * @param orderByField - Optional field to order by
 * @param orderDirection - Order direction (asc/desc)
 * @returns Array of company documents
 * @throws {FirebaseError} If the operation fails
 */
export async function getCompanyDocuments<T extends DocumentData>(
  collectionName: string,
  companyId: string,
  orderByField?: string,
  orderDirection: OrderByDirection = 'desc'
): Promise<T[]> {
  return queryDocuments<T>(
    collectionName,
    'companyId',
    '==',
    companyId,
    orderByField,
    orderDirection
  );
}

/**
 * Get documents by companyId only (shared public app - no userId needed)
 * 
 * @template T - The type of documents to retrieve
 * @param collectionName - Firestore collection name
 * @param userId - User ID (ignored in shared public app)
 * @param companyId - Company ID to filter by
 * @param orderByField - Optional field to order by
 * @param orderDirection - Order direction (asc/desc)
 * @returns Array of company documents
 * @throws {FirebaseError} If the operation fails
 */
export async function getUserCompanyDocuments<T extends DocumentData>(
  collectionName: string,
  userId: string | null,
  companyId: string,
  orderByField?: string,
  orderDirection: OrderByDirection = 'desc'
): Promise<T[]> {
  // Shared public app - query only by companyId, userId is ignored
  return getCompanyDocuments<T>(collectionName, companyId, orderByField, orderDirection);
}

/**
 * Check if a document exists
 * 
 * @param collectionName - Firestore collection name
 * @param docId - Document ID
 * @returns True if document exists, false otherwise
 */
export async function documentExists(
  collectionName: string,
  docId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error: any) {
    logError(error, `documentExists:${collectionName}`);
    return false;
  }
}

/**
 * Count documents in a collection (with optional filter)
 * 
 * @param collectionName - Firestore collection name
 * @param field - Optional field to filter by
 * @param operator - Firestore where operator
 * @param value - Value to filter by
 * @returns Number of documents
 */
export async function countDocuments(
  collectionName: string,
  field?: string,
  operator?: WhereFilterOp,
  value?: unknown
): Promise<number> {
  try {
    const constraints: QueryConstraint[] = [];

    if (field && operator && value !== undefined) {
      constraints.push(where(field, operator, value));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.size;
  } catch (error: any) {
    logError(error, `countDocuments:${collectionName}`);
    return 0;
  }
}

/**
 * Batch get multiple documents by IDs
 * 
 * @template T - The type of documents to retrieve
 * @param collectionName - Firestore collection name
 * @param docIds - Array of document IDs
 * @returns Array of documents (null values filtered out)
 * @throws {FirebaseError} If the operation fails
 */
export async function getMultipleDocuments<T extends DocumentData>(
  collectionName: string,
  docIds: string[]
): Promise<T[]> {
  try {
    const promises = docIds.map(id => getDocument<T>(collectionName, id));
    const results = await Promise.all(promises);
    return results.filter((doc): doc is T => doc !== null);
  } catch (error: any) {
    logError(error, `getMultipleDocuments:${collectionName}`);
    throw handleFirebaseError(error);
  }
}

/**
 * Convert Firestore Timestamp to Date
 * 
 * @param timestamp - Firestore Timestamp or any date-like object
 * @returns JavaScript Date object
 */
export function timestampToDate(timestamp: Timestamp | Date | { toDate(): Date } | number): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp instanceof Date) {
    return timestamp;
  }
  if (typeof timestamp === 'object' && 'toDate' in timestamp) {
    return timestamp.toDate();
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  return new Date();
}

/**
 * Search documents by field containing text (case-insensitive)
 * 
 * Note: Firestore doesn't support full-text search natively.
 * This is a basic implementation - consider using Algolia/Typesense for production.
 * 
 * @template T - The type of documents to search
 * @param collectionName - Firestore collection name
 * @param field - Field to search in
 * @param searchTerm - Search term
 * @param userId - User ID (not used in shared public app)
 * @returns Array of matching documents
 */
export async function searchDocuments<T extends DocumentData>(
  collectionName: string,
  field: string,
  searchTerm: string,
  userId?: string
): Promise<T[]> {
  try {
    // Shared public app - always get all documents
    const documents = await getAllDocuments<T>(collectionName);

    // Client-side filtering (not ideal for large datasets)
    const searchLower = searchTerm.toLowerCase();
    return documents.filter(doc => {
      const fieldValue = (doc as Record<string, unknown>)[field];
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(searchLower);
      }
      return false;
    });
  } catch (error: any) {
    logError(error, `searchDocuments:${collectionName}`);
    return [];
  }
}
