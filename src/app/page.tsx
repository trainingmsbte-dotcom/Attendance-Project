"use client";

import type { FC } from "react";
import React, {
  useState,
  useEffect,
  useCallback
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
  setDoc
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
import RfidScanner from "@/app/components/rfid-scanner";
import AttendanceTable from "@/app/components/attendance-table";
import AttendanceAnalytics from "@/app/components/attendance-analytics";
import ApiKeyManager from "@/app/components/api-key-manager";
import { initialStudents } from "@/app/lib/data";
import Stats from "@/app/components/stats";


const Home: FC = () => {
  const [students, setStudents] = useState < Student[] > ([]);
  const [attendanceRecords, setAttendanceRecords] = useState < AttendanceRecord[] > ([]);
  const {
    toast
  } = useToast();

  // Seed initial student data if students collection is empty
  useEffect(() => {
    const studentsRef = collection(db, "students");
    const seedData = async () => {
      const snapshot = await getDocs(studentsRef);
      if (snapshot.empty) {
        console.log("No students found, seeding initial data...");
        const seedPromises = initialStudents.map(student => {
          const studentDocRef = doc(studentsRef, student.id);
          return setDoc(studentDocRef, { name: student.name, rfid: student.rfid });
        });
        await Promise.all(seedPromises);
        console.log("Initial student data seeded.");
      } else {
        console.log("Students collection already has data.");
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
    });
    return () => unsubscribe();
  }, []);

  // Listener for today's attendance records
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = query(collection(db, "attendance"), where("checkInTime", ">=", today));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records = snapshot.docs.map(doc => {
        const data = doc.data();
        const checkInTime = data.checkInTime?.toDate ? data.checkInTime.toDate() : new Date(data.checkInTime);
        return {
          studentId: data.studentId,
          checkInTime: checkInTime,
          date: checkInTime.toISOString(),
        } as AttendanceRecord
      });
      setAttendanceRecords(records);
    });

    return () => unsubscribe();
  }, []);

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
        collection(db, "attendance"),
        where("studentId", "==", student.id),
        where("checkInTime", ">=", todayStart),
        where("checkInTime", "<=", todayEnd)
      );

      const attendanceSnapshot = await getDocs(attendanceQuery);

      if (!attendanceSnapshot.empty) {
        toast({
          title: "Already Checked In",
          description: `${student.name} has already checked in today.`,
        });
        return;
      }

      await addDoc(collection(db, "attendance"), {
        studentId: student.id,
        checkInTime: serverTimestamp(),
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
      <Header />
      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="container mx-auto space-y-8">
          <Stats students={students} attendanceRecords={attendanceRecords} />
          
          <div className="grid grid-cols-1 gap-8">
            <AttendanceTable students={students} attendanceRecords={attendanceRecords} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pt-8">
            <div className="lg:col-span-1">
              <AttendanceAnalytics attendanceRecords={attendanceRecords} students={students} />
            </div>
            <div className="lg:col-span-1">
              <RfidScanner onCheckIn={handleCheckIn} />
            </div>
            <div className="lg:col-span-1">
              <ApiKeyManager />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
