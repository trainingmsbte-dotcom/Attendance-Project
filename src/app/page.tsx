"use client";

import type { FC } from "react";
import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  doc,
  setDoc,
  orderBy
} from "firebase/firestore";
import {
  db
} from "@/lib/firebase";
import type {
  Student,
  AttendanceRecord
} from "@/app/lib/data";
import {
  useToast
} from "@/hooks/use-toast";
import Header from "@/app/components/header";
import { initialStudents } from "@/app/lib/data";
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Receipt, School } from "lucide-react";
import RecentCheckinsTable from "@/app/components/recent-checkins-table";


const Home: FC = () => {
  const [students, setStudents] = useState < Student[] > ([]);
  const [rawRfidScans, setRawRfidScans] = useState<{ uid: string; timestamp: Date }[]>([]);
  const {
    toast
  } = useToast();

  // Seed initial student data if students collection is empty
  useEffect(() => {
    const studentsRef = collection(db, "students");
    const seedData = async () => {
      try {
        const snapshot = await getDocs(studentsRef);
        if (snapshot.empty) {
          console.log("No students found, seeding initial data...");
          const seedPromises = initialStudents.map(student => {
            const studentDocRef = doc(studentsRef, student.id); // Use student.id as the document ID
            return setDoc(studentDocRef, { name: student.name, rfid: student.rfid });
          });
          await Promise.all(seedPromises);
          console.log("Initial student data seeded.");
        } else {
          console.log("Students collection already has data.");
        }
      } catch (error) {
        console.error("Error seeding data:", error)
      }
    };
    seedData().catch(console.error);
  }, []);
  
  // Listener for student data
  useEffect(() => {
    const q = query(collection(db, "students"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const studentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Student));
      setStudents(studentList);
    }, (error) => {
      console.error("Error fetching students:", error)
    });
    return () => unsubscribe();
  }, []);

  // Listener for today's raw RFID scans from 'rfid' collection
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(
      collection(db, "rfid"), 
      where("timestamp", ">=", today),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const scans = snapshot.docs.map(docSnapshot => {
        const data = docSnapshot.data();
        return {
          uid: data.uid,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp),
        };
      });
      setRawRfidScans(scans);
    }, (error) => {
      console.error("Error fetching rfid scans:", error)
    });

    return () => unsubscribe();
  }, []);
  
  // Combine student data and rfid scans into attendance records
  const attendanceRecords: AttendanceRecord[] = useMemo(() => {
    if (!students.length || !rawRfidScans.length) {
      return [];
    }
    
    // Create a map for quick student lookup by RFID
    const studentMapByRfid = new Map(students.map(s => [s.rfid, s]));

    return rawRfidScans
      .map(scan => {
        const student = studentMapByRfid.get(scan.uid);
        if (student) {
          return {
            studentId: student.id,
            checkInTime: scan.timestamp,
            date: scan.timestamp.toISOString(),
          } as AttendanceRecord;
        }
        return null;
      })
      .filter((record): record is AttendanceRecord => record !== null);

  }, [students, rawRfidScans]);

  const handleCheckIn = useCallback(async (rfid: string) => {
    try {
      const studentsQuery = query(collection(db, "students"), where("rfid", "==", rfid));
      const studentSnapshot = await getDocs(studentsQuery);

      if (studentSnapshot.empty) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Invalid RFID. Student not found.",
        });
        return;
      }

      const studentDoc = studentSnapshot.docs[0];
      const student = {
        id: studentDoc.id,
        ...studentDoc.data()
      } as Student;

      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      const attendanceQuery = query(
        collection(db, "rfid"),
        where("uid", "==", rfid),
        where("timestamp", ">=", todayStart),
        where("timestamp", "<=", todayEnd)
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);

      if (!attendanceSnapshot.empty) {
        toast({
          title: "Already Checked In",
          description: `${student.name} has already checked in today.`,
        });
        return;
      }

      await addDoc(collection(db, "rfid"), {
        uid: rfid,
        timestamp: serverTimestamp(),
      });

      toast({
        title: "Check-in Successful",
        description: `${student.name} has been successfully checked in.`,
      });
    } catch (error) {
      console.error("Error checking in:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred during check-in.",
      });
    }
  }, [toast]);


  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
                <School className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Smart School System
            </h1>
          </div>
        </SidebarHeader>
        <SidebarContent>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton href="#" isActive>
                        <Receipt />
                        Recent Transactions
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <Header />
        <main className="flex-grow p-4 sm:p-6 md:p-8">
          <div className="container mx-auto space-y-8">
            <RecentCheckinsTable students={students} attendanceRecords={attendanceRecords} />
          </div>
        </main>
      </SidebarInset>
    </div>
  );
};

export default Home;
