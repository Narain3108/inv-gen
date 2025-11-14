/**
 * useFirestore Hook
 * Generic Firestore CRUD operations
 */

'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface UseFirestoreOptions {
  collectionPath: string;
  queryConstraints?: any[];
  dependencies?: any[];
}

export const useFirestore = <T extends DocumentData>(
  options: UseFirestoreOptions
) => {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { collectionPath, queryConstraints = [], dependencies = [] } = options;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const collectionRef = collection(db, collectionPath);
        
        let q: Query = collectionRef;
        if (queryConstraints.length > 0) {
          q = query(collectionRef, ...queryConstraints);
        }

        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as unknown as T[];

        setData(items);
        setError(null);
      } catch (err) {
        setError(err as Error);
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [collectionPath, ...dependencies]);

  return { data, loading, error };
};

export const useFirestoreDoc = <T extends DocumentData>(
  collectionPath: string,
  docId: string | null
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!docId) {
      setLoading(false);
      return;
    }

    const fetchDoc = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, collectionPath, docId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setData({ id: docSnap.id, ...docSnap.data() } as unknown as T);
        } else {
          setData(null);
        }
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchDoc();
  }, [collectionPath, docId]);

  return { data, loading, error };
};
