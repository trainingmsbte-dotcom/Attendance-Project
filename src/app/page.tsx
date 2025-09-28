
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
import { collection, onSnapshot, orderBy, query, doc, deleteDoc, Timestamp } from "firebase/firestore";
import { useSearchParams, useRouter } from 'next/navigation';
import { Pencil, Trash2 } from "lucide-react";
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

  const getStudentName = (uid: string) => {
    const student = students.find((s) => s.uid === uid);
    return student ? student.name : "Unknown Student";
  };

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
                          <TableHead>Student Name</TableHead>
                          <TableHead>RFID UID</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.length > 0 ? (
                          students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">{student.name}</TableCell>
                              <TableCell>{student.uid}</TableCell>
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
            <Card id="attendance">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Attendance Record</CardTitle>
                <div className="text-lg font-medium text-muted-foreground">
                  {currentTime ? currentTime.toLocaleTimeString() : 'Loading...'}
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
                          <TableHead>Student Name</TableHead>
                          <TableHead>RFID UID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rfidLogs.length > 0 ? (
                          rfidLogs.map((log) => (
                            <TableRow key={log.id}>
                              <TableCell>{getStudentName(log.uid)}</TableCell>
                              <TableCell>{log.uid}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
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
