
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileDown } from "lucide-react";
import * as XLSX from "xlsx";
import { useToast } from "@/hooks/use-toast";

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
  const [selectedClasses, setSelectedClasses] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, "attendance_batches"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const batchesData: Batch[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      } as Batch));
      setBatches(batchesData);

      // Initialize selected classes state
      const initialSelectedClasses: { [key: string]: string } = {};
      batchesData.forEach(batch => {
        initialSelectedClasses[batch.id] = 'all';
      });
      setSelectedClasses(initialSelectedClasses);

      setLoading(false);
    }, (error) => {
      console.error("Error fetching batches: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getUniqueClassesForBatch = (records: BatchRecord[]) => {
    const classNames = records.map(r => r.className);
    return [...new Set(classNames)];
  }

  const handleClassChange = (batchId: string, value: string) => {
    setSelectedClasses(prev => ({ ...prev, [batchId]: value }));
  };

  const handleExport = (batch: Batch) => {
    const selectedClass = selectedClasses[batch.id] || 'all';

    const dataToExport = batch.records
      .filter(record => {
        if (selectedClass === 'all') {
          return true;
        }
        return record.className === selectedClass;
      })
      .map(record => ({
        'RFID UID': record.uid,
        'Student Name': record.name,
        'Class': record.className
      }));

    if (dataToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: `No attendance records found for ${selectedClass === 'all' ? 'any class' : selectedClass} in this batch.`,
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const safeBatchName = batch.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const fileName = selectedClass === 'all' 
      ? `Batch_${safeBatchName}_All.xlsx` 
      : `Batch_${safeBatchName}_${selectedClass.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };


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
                      <div className="space-y-4">
                        <div className="flex justify-end items-center gap-2">
                          <Select 
                            value={selectedClasses[batch.id] || 'all'} 
                            onValueChange={(value) => handleClassChange(batch.id, value)}
                          >
                            <SelectTrigger className="w-full sm:w-[180px]">
                              <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Classes</SelectItem>
                              {getUniqueClassesForBatch(batch.records).map(className => (
                                <SelectItem key={className} value={className}>{className}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button onClick={() => handleExport(batch)} variant="outline" size="sm">
                            <FileDown className="mr-2 h-4 w-4" />
                            Export
                          </Button>
                        </div>
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
