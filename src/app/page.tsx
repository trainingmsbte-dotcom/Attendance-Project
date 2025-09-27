
'use client';

import { useState, useEffect } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  Timestamp,
  addDoc,
  serverTimestamp,
} from 'firebase/firestore';
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
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Define the structure of an RFID data entry
interface RfidData {
  id: string;
  uid: string;
  timestamp: Date | null;
}

// Zod schema for the new student form
const studentFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  uid: z.string().min(4, {
    message: 'RFID UID must be at least 4 characters.',
  }),
});

export default function HomePage() {
  const [rfidData, setRfidData] = useState<RfidData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof studentFormSchema>>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: '',
      uid: '',
    },
  });

  useEffect(() => {
    if (!db) {
      setError('Firestore database is not available.');
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'rfid'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const data: RfidData[] = querySnapshot.docs.map((doc) => {
          const docData = doc.data();
          const timestamp =
            docData.timestamp instanceof Timestamp
              ? docData.timestamp.toDate()
              : null;

          return {
            id: doc.id,
            uid: docData.uid || 'N/A',
            timestamp: timestamp,
          };
        });

        setRfidData(data);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error fetching data from Firestore: ', err);
        setError(
          'Failed to fetch data. This is likely due to Firestore Security Rules. Please check the browser console for the specific error.'
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function onSubmit(values: z.infer<typeof studentFormSchema>) {
    try {
      await addDoc(collection(db, 'students'), {
        name: values.name,
        uid: values.uid,
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Success!',
        description: 'New student has been added.',
      });
      form.reset();
    } catch (e) {
      console.error('Error adding document: ', e);
      toast({
        title: 'Error',
        description: 'Failed to add student. Please try again.',
        variant: 'destructive',
      });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Add New Student</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uid"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RFID UID</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. 1A2B3C4D" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Save Student</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              RFID Scans
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <p className="text-center">Loading data from Firestore...</p>
            )}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!loading && !error && rfidData.length === 0 && (
              <p className="text-center text-muted-foreground">
                No RFID data found in the collection.
              </p>
            )}
            {!loading && !error && rfidData.length > 0 && (
              <div className="overflow-x-auto">
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
                          {item.timestamp
                            ? item.timestamp.toLocaleString()
                            : 'Invalid Date'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
