
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
  getDocs,
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

interface RfidData {
  id: string;
  uid: string;
  timestamp: Date | null;
}

interface Student {
  id: string;
  name: string;
  uid: string;
}

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
  const [students, setStudents] = useState<Map<string, string>>(new Map());
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
      setError('Firestore is not connected.');
      setLoading(false);
      return;
    }

    const fetchStudents = async () => {
      try {
        const studentCollection = collection(db, 'students');
        const studentSnapshot = await getDocs(studentCollection);
        const studentMap = new Map<string, string>();
        studentSnapshot.forEach((doc) => {
          const studentData = doc.data();
          studentMap.set(studentData.uid, studentData.name);
        });
        setStudents(studentMap);
      } catch (err) {
        console.error('Error fetching students: ', err);
        setError('Failed to fetch student data.');
      }
    };

    fetchStudents();

    const q = query(
      collection(db, 'rfid'),
      orderBy('timestamp', 'desc'),
      orderBy('uid', 'asc')
    );

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
      },
      (err) => {
        console.error('Error fetching RFID data from Firestore: ', err);
        setError(
          'Failed to fetch RFID data. This is likely due to Firestore Security Rules or a missing index. Please check the browser console for the specific error.'
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  async function onSubmit(values: z.infer<typeof studentFormSchema>) {
    if (!db) {
      toast({
        title: 'Error',
        description: 'Firestore is not connected.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await addDoc(collection(db, 'students'), {
        name: values.name,
        uid: values.uid.toUpperCase(),
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Success!',
        description: 'New student has been added.',
      });
      form.reset();
      // Refresh student list after adding a new one
      const studentCollection = collection(db, 'students');
      const studentSnapshot = await getDocs(studentCollection);
      const studentMap = new Map<string, string>();
      studentSnapshot.forEach((doc) => {
        const studentData = doc.data();
        studentMap.set(studentData.uid, studentData.name);
      });
      setStudents(studentMap);
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
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24 bg-gray-50">
      <div className="w-full max-w-4xl space-y-8">
        <Card className="shadow-md">
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

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">
              Attendance Log
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <p className="text-center">Loading attendance data...</p>
            )}
            {error && <p className="text-center text-red-500">{error}</p>}
            {!loading && !error && rfidData.length === 0 && (
              <p className="text-center text-muted-foreground">
                No attendance data found. Waiting for RFID scans...
              </p>
            )}
            {!loading && !error && rfidData.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student Name</TableHead>
                      <TableHead>UID</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rfidData.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          {students.get(item.uid) || (
                            <span className="text-destructive">
                              Unknown Student
                            </span>
                          )}
                        </TableCell>
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
