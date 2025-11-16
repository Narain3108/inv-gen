/**
 * Firestore Test Page
 * Debug page to test Firestore read/write operations
 */

'use client';

import { useState } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestFirestorePage() {
  const [testData, setTestData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const writeTest = async () => {
    setLoading(true);
    setMessage('');
    try {
      const testDoc = {
        name: 'Test Company ' + Date.now(),
        createdAt: new Date(),
        testField: 'This is a test'
      };
      
      console.log('Writing test document:', testDoc);
      const docRef = await addDoc(collection(db, 'test_collection'), testDoc);
      console.log('Document written with ID:', docRef.id);
      setMessage(`✅ Successfully wrote document with ID: ${docRef.id}`);
      
      // Read it back
      await readTest();
    } catch (error) {
      console.error('Error writing document:', error);
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const readTest = async () => {
    setLoading(true);
    setMessage('');
    try {
      console.log('Reading test collection...');
      const querySnapshot = await getDocs(collection(db, 'test_collection'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('Read documents:', data);
      setTestData(data);
      setMessage(`✅ Successfully read ${data.length} documents`);
    } catch (error) {
      console.error('Error reading documents:', error);
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearTest = async () => {
    setLoading(true);
    setMessage('');
    try {
      console.log('Clearing test collection...');
      const querySnapshot = await getDocs(collection(db, 'test_collection'));
      const deletePromises = querySnapshot.docs.map(document => 
        deleteDoc(doc(db, 'test_collection', document.id))
      );
      
      await Promise.all(deletePromises);
      console.log('Deleted all documents');
      setTestData([]);
      setMessage(`✅ Successfully deleted ${deletePromises.length} documents`);
    } catch (error) {
      console.error('Error clearing collection:', error);
      setMessage(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>Firestore Connection Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={writeTest} disabled={loading}>
              Write Test Document
            </Button>
            <Button onClick={readTest} disabled={loading} variant="outline">
              Read Test Documents
            </Button>
            <Button onClick={clearTest} disabled={loading} variant="destructive">
              Clear Test Collection
            </Button>
          </div>

          {message && (
            <div className={`p-4 rounded ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {message}
            </div>
          )}

          {testData.length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Documents:</h3>
              <pre className="bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(testData, null, 2)}
              </pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded">
            <h4 className="font-semibold mb-2">Instructions:</h4>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Click "Write Test Document" to create a document in Firestore</li>
              <li>Check browser console for detailed logs</li>
              <li>Open this page in different browsers to verify data is shared</li>
              <li>Click "Read Test Documents" to verify data persists</li>
              <li>Open Firebase Console to see the data: https://console.firebase.google.com/project/bill-6a1a2/firestore</li>
              <li>When done testing, click "Clear Test Collection"</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
