
"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';

interface BatchRecord {
  uid: string;
  name: string;
  className: string;
}

interface Batch {
  id: string;
  name: string;
  createdAt: Timestamp;
  records: BatchRecord[];
}

export default function BatchesPage() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "attendance_batches"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const batchesData: Batch[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Batch));
      setBatches(batchesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching batches: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-5xl space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Attendance Batches</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            View archived attendance records.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Archived Batches</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center text-muted-foreground">Loading batches...</div>
            ) : batches.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {batches.map((batch) => (
                  <AccordionItem value={batch.id} key={batch.id}>
                    <AccordionTrigger>
                      <div className="flex justify-between w-full pr-4">
                        <span>{batch.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {batch.createdAt ? format(batch.createdAt.toDate(), 'PPP p') : 'No date'} ({batch.records.length} records)
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>RFID UID</TableHead>
                              <TableHead>Student Name</TableHead>
                              <TableHead>Class</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {batch.records.map((record, index) => (
                              <TableRow key={`${batch.id}-${index}`}>
                                <TableCell>{record.uid}</TableCell>
                                <TableCell>{record.name}</TableCell>
                                <TableCell>{record.className}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center text-muted-foreground h-24 flex items-center justify-center">
                No batches found.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
