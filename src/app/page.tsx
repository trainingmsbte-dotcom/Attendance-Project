
"use client";

import { useEffect, useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, Timestamp, addDoc, getDocs, writeBatch } from "firebase/firestore";
import { useSearchParams, useRouter } from 'next/navigation';
import { Pencil, Trash2, FileDown, Archive } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import * as XLSX from "xlsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";


// Define the type for a student document from Firestore
interface Student {
  id: string;
  name: string;
  uid: string;
  className: string;
  createdAt: Timestamp;
}

// Define the type for an RFID log document from Firestore
interface RfidLog {
  id: string;
  uid: string;
}

function HomePageContent() {
  const [students, setStudents] = useState<Student[]>([]);
  const [rfidLogs, setRfidLogs] = useState<RfidLog[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingRfid, setLoadingRfid] = useState(true);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [selectedClassForExport, setSelectedClassForExport] = useState<string>("all");
  const [isBatching, setIsBatching] = useState(false);
  const [batchName, setBatchName] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const view = searchParams.get('view') || 'students';

  // Effect for fetching students
  useEffect(() => {
    if (!db) {
      console.error("Firestore database instance is not available.");
      setLoadingStudents(false);
      return;
    }
    const q = query(collection(db, "students"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const studentsData: Student[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Student));
      setStudents(studentsData);
      setLoadingStudents(false);
    }, (error) => {
      console.error("Error fetching students: ", error);
      setLoadingStudents(false);
    });
    return () => unsubscribe();
  }, []);
  
  // Effect for fetching RFID logs
  useEffect(() => {
    if (!db) {
      console.error("Firestore database instance is not available.");
      setLoadingRfid(false);
      return;
    }
    const q = query(collection(db, "rfid"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const rfidData: RfidLog[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as RfidLog));
      setRfidLogs(rfidData);
      setLoadingRfid(false);
    }, (error) => {
      console.error("Error fetching RFID logs: ", error);
      setLoadingRfid(false);
    });
    return () => unsubscribe();
  }, []);

  // Effect for the real-time clock
  useEffect(() => {
    setCurrentTime(new Date());
    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timerId);
  }, []);

  const getStudentInfo = (uid: string) => {
    const student = students.find((s) => s.uid === uid);
    return student ? { name: student.name, className: student.className } : { name: "Unknown Student", className: "N/A" };
  };

  const getUniqueClasses = () => {
    const classNames = students.map(s => s.className);
    return [...new Set(classNames)];
  }

  const handleDeleteClick = (student: Student) => {
    setStudentToDelete(student);
  };

  const confirmDelete = async () => {
    if (studentToDelete) {
      try {
        await deleteDoc(doc(db, "students", studentToDelete.id));
        toast({
          title: "Success!",
          description: "Student has been deleted.",
        });
      } catch (error) {
        console.error("Error deleting student: ", error);
        toast({
          variant: "destructive",
          title: "Uh oh! Something went wrong.",
          description: "There was a problem deleting the student. Please try again.",
        });
      } finally {
        setStudentToDelete(null);
      }
    }
  };

  const handleExport = () => {
    const dataToExport = rfidLogs
      .map(log => {
        const studentInfo = getStudentInfo(log.uid);
        return {
          'RFID UID': log.uid,
          'Student Name': studentInfo.name,
          'Class': studentInfo.className
        };
      })
      .filter(record => {
        if (selectedClassForExport === 'all') {
          return true;
        }
        return record.Class === selectedClassForExport;
      });

    if (dataToExport.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: `No attendance records found for ${selectedClassForExport === 'all' ? 'any class' : selectedClassForExport}.`,
      });
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");

    const fileName = selectedClassForExport === 'all' 
      ? "AttendanceRecord_All.xlsx" 
      : `AttendanceRecord_${selectedClassForExport.replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };
  
  const handleCreateBatch = async () => {
    if (!batchName) {
      toast({
        variant: "destructive",
        title: "Batch Name Required",
        description: "Please enter a name for the batch.",
      });
      return;
    }
    if (rfidLogs.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data",
        description: "There are no attendance records to batch.",
      });
      return;
    }

    try {
      // 1. Prepare batch data
      const batchRecords = rfidLogs.map(log => {
        const studentInfo = getStudentInfo(log.uid);
        return {
          uid: log.uid,
          name: studentInfo.name,
          className: studentInfo.className
        };
      });

      // 2. Add new batch document to 'attendance_batches'
      await addDoc(collection(db, "attendance_batches"), {
        name: batchName,
        createdAt: new Date(),
        records: batchRecords,
      });

      // 3. Delete all documents from 'rfid' collection
      const rfidCollection = collection(db, "rfid");
      const rfidSnapshot = await getDocs(rfidCollection);
      const deleteBatch = writeBatch(db);
      rfidSnapshot.docs.forEach((doc) => {
        deleteBatch.delete(doc.ref);
      });
      await deleteBatch.commit();
      
      toast({
        title: "Success!",
        description: `Batch "${batchName}" created and current attendance cleared.`,
      });

    } catch (error) {
      console.error("Error creating batch: ", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem creating the batch. Please try again.",
      });
    } finally {
      setIsBatching(false);
      setBatchName("");
    }
  };


  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-5xl space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Student Management System</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A central place to manage all student records.
          </p>
        </div>

        <Tabs value={view} onValueChange={(value) => router.push(`/?view=${value}`)} className="w-full">
          <TabsContent value="students">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Registered Students</CardTitle>
                <Button asChild>
                  <Link href="/student/add">Add New Student</Link>
                </Button>
              </CardHeader>
              <CardContent>
                {loadingStudents ? (
                  <div className="text-center text-muted-foreground">Loading student data...</div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>RFID UID</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.length > 0 ? (
                          students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>{student.uid}</TableCell>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.className}</TableCell>
                              <TableCell className="text-right">
                                <Button asChild variant="ghost" size="icon">
                                  <Link href={`/student/edit/${student.id}`}>
                                    <Pencil className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(student)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-24 text-center">
                              No students found. Add a new student to see them here.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="attendance">
             <div className="flex justify-end mb-4">
               <Button onClick={() => setIsBatching(true)} variant="outline">
                  <Archive className="mr-2 h-4 w-4" />
                  Create Batch & Clear
                </Button>
            </div>
            <Card id="attendance">
              <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <CardTitle>Attendance Record</CardTitle>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
                  <div className="text-lg font-medium text-muted-foreground self-center sm:self-auto">
                    {currentTime ? currentTime.toLocaleTimeString() : 'Loading...'}
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap justify-end">
                    <Select value={selectedClassForExport} onValueChange={setSelectedClassForExport}>
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Classes</SelectItem>
                          {getUniqueClasses().map(className => (
                            <SelectItem key={className} value={className}>{className}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    <Button onClick={handleExport} variant="outline" size="sm" className="w-full sm:w-auto">
                      <FileDown className="mr-2 h-4 w-4" />
                      Export to Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loadingRfid ? (
                  <div className="text-center text-muted-foreground">Loading RFID data...</div>
                ) : (
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
                        {rfidLogs.length > 0 ? (
                          rfidLogs.map((log) => {
                            const studentInfo = getStudentInfo(log.uid);
                            return (
                              <TableRow key={log.id}>
                                <TableCell>{log.uid}</TableCell>
                                <TableCell>{studentInfo.name}</TableCell>
                                <TableCell>{studentInfo.className}</TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="h-24 text-center">
                              No RFID transactions found.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <AlertDialog open={!!studentToDelete} onOpenChange={() => setStudentToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the student
              and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

       <Dialog open={isBatching} onOpenChange={setIsBatching}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Attendance Batch</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <p className="text-sm text-muted-foreground">
              This will archive all current attendance records into a new batch and clear the current list. This action cannot be undone.
            </p>
            <Input
              placeholder="Enter batch name (e.g., 'Morning Session 2024-07-31')"
              value={batchName}
              onChange={(e) => setBatchName(e.target.value)}
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button onClick={handleCreateBatch}>Create Batch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
