"use client";

import { useEffect, useState } from "react";
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
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query, Timestamp } from "firebase/firestore";

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

export default function HomePage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [rfidLogs, setRfidLogs] = useState<RfidLog[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingRfid, setLoadingRfid] = useState(true);

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

  const getStudentName = (uid: string) => {
    const student = students.find((s) => s.uid === uid);
    return student ? student.name : "Unknown Student";
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12">
      <div className="w-full max-w-5xl space-y-10">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">Student Management System</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            A central place to manage all student records.
          </p>
          <Button asChild className="mt-6">
            <Link href="/student/add">Add New Student</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Registered Students</CardTitle>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.length > 0 ? (
                      students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>{student.uid}</TableCell>
                          <TableCell>{student.className}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="h-24 text-center">
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

        <Card id="attendance">
          <CardHeader>
            <CardTitle>Attendance Record</CardTitle>
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
      </div>
    </main>
  );
}
