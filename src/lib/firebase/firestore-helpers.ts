/**
 * Firestore Helper Functions
 * 
 * Generic CRUD operations and query helpers for Firestore
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

/**
 * Get a single document by ID
 */
export async function getDocument<T>(
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
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get all documents from a collection
 */
export async function getAllDocuments<T>(
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
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get documents with a query filter
 */
export async function queryDocuments<T>(
  collectionName: string,
  field: string,
  operator: WhereFilterOp,
  value: any,
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
  } catch (error) {
    console.error(`Error querying documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Create a new document with auto-generated ID
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
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Create or overwrite a document with specific ID
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
  } catch (error) {
    console.error(`Error setting document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Update an existing document
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
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Delete a document
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Get documents by user ID (for multi-user data)
 */
export async function getUserDocuments<T>(
  collectionName: string,
  userId: string,
  orderByField?: string,
  orderDirection: OrderByDirection = 'desc'
): Promise<T[]> {
  return queryDocuments<T>(
    collectionName,
    'userId',
    '==',
    userId,
    orderByField,
    orderDirection
  );
}

/**
 * Get documents by company ID (for multi-company support)
 */
export async function getCompanyDocuments<T>(
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
 * Get documents by userId and companyId (for user-specific data isolation in SaaS)
 */
export async function getUserCompanyDocuments<T>(
  collectionName: string,
  userId: string,
  companyId: string,
  orderByField?: string,
  orderDirection: OrderByDirection = 'desc'
): Promise<T[]> {
  try {
    const constraints: QueryConstraint[] = [
      where('userId', '==', userId),
      where('companyId', '==', companyId)
    ];

    if (orderByField) {
      constraints.push(orderBy(orderByField, orderDirection));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error getting user company documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Check if a document exists
 */
export async function documentExists(
  collectionName: string,
  docId: string
): Promise<boolean> {
  try {
    const docRef = doc(db, collectionName, docId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  } catch (error) {
    console.error(`Error checking document existence in ${collectionName}:`, error);
    return false;
  }
}

/**
 * Count documents in a collection (with optional filter)
 */
export async function countDocuments(
  collectionName: string,
  field?: string,
  operator?: WhereFilterOp,
  value?: any
): Promise<number> {
  try {
    const constraints: QueryConstraint[] = [];

    if (field && operator && value !== undefined) {
      constraints.push(where(field, operator, value));
    }

    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.size;
  } catch (error) {
    console.error(`Error counting documents in ${collectionName}:`, error);
    return 0;
  }
}

/**
 * Batch get multiple documents by IDs
 */
export async function getMultipleDocuments<T>(
  collectionName: string,
  docIds: string[]
): Promise<T[]> {
  try {
    const promises = docIds.map(id => getDocument<T>(collectionName, id));
    const results = await Promise.all(promises);
    return results.filter(doc => doc !== null) as T[];
  } catch (error) {
    console.error(`Error getting multiple documents from ${collectionName}:`, error);
    throw error;
  }
}

/**
 * Convert Firestore Timestamp to Date
 */
export function timestampToDate(timestamp: Timestamp | any): Date {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  if (timestamp?.toDate) {
    return timestamp.toDate();
  }
  return new Date(timestamp);
}

/**
 * Search documents by field containing text (case-insensitive)
 * Note: Firestore doesn't support full-text search natively
 * This is a basic implementation - consider using Algolia/Typesense for production
 */
export async function searchDocuments<T>(
  collectionName: string,
  field: string,
  searchTerm: string,
  userId?: string
): Promise<T[]> {
  try {
    let documents: T[];

    if (userId) {
      documents = await getUserDocuments<T>(collectionName, userId);
    } else {
      documents = await getAllDocuments<T>(collectionName);
    }

    // Client-side filtering (not ideal for large datasets)
    const searchLower = searchTerm.toLowerCase();
    return documents.filter(doc => {
      const fieldValue = (doc as any)[field];
      if (typeof fieldValue === 'string') {
        return fieldValue.toLowerCase().includes(searchLower);
      }
      return false;
    });
  } catch (error) {
    console.error(`Error searching documents in ${collectionName}:`, error);
    return [];
  }
}
