
'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// Define the structure of an RFID data entry
interface RfidData {
  id: string;
  uid: string;
  timestamp: Date | null;
}

export default function HomePage() {
  const [rfidData, setRfidData] = useState<RfidData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Create a query to get documents from the 'rfid' collection, ordered by timestamp
    const q = query(collection(db, 'rfid'), orderBy('timestamp', 'desc'));

    // Set up a real-time listener to get updates
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data: RfidData[] = [];
        querySnapshot.forEach((doc) => {
          const docData = doc.data();
          // Convert Firestore Timestamp to JavaScript Date object
          const timestamp = docData.timestamp instanceof Timestamp ? docData.timestamp.toDate() : null;
          
          data.push({
            id: doc.id,
            uid: docData.uid || 'N/A',
            timestamp: timestamp,
          });
        });
        setRfidData(data);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching data: ", err);
        setError('Failed to fetch data from Firestore. Please check the console for more details.');
        setLoading(false);
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">RFID Scans</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-center">Loading data...</p>}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!loading && !error && rfidData.length === 0 && (
              <p className="text-center text-muted-foreground">No RFID data found in the collection.</p>
            )}
            {!loading && !error && rfidData.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>UID</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rfidData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.uid}</TableCell>
                      <TableCell>
                        {item.timestamp ? item.timestamp.toLocaleString() : 'Invalid Date'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
