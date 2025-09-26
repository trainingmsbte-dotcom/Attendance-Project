"use client";

import type { FC } from "react";
import React, { useState, useCallback } from "react";
import type { Student, AttendanceRecord } from "@/app/lib/data";
import { initialStudents, initialAttendanceRecords } from "@/app/lib/data";
import { useToast } from "@/hooks/use-toast";
import Header from "@/app/components/header";
import RfidScanner from "@/app/components/rfid-scanner";
import AttendanceTable from "@/app/components/attendance-table";
import AttendanceAnalytics from "@/app/components/attendance-analytics";

const Home: FC = () => {
  const [students] = useState<Student[]>(initialStudents);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(initialAttendanceRecords);
  const { toast } = useToast();

  const handleCheckIn = useCallback((rfid: string) => {
    const student = students.find((s) => s.rfid === rfid);
    if (!student) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid RFID. Student not found.",
      });
      return;
    }

    const today = new Date().toISOString().split("T")[0];
    const alreadyCheckedIn = attendanceRecords.some(
      (record) =>
        record.studentId === student.id && record.date.startsWith(today)
    );

    if (alreadyCheckedIn) {
      toast({
        title: "Already Checked In",
        description: `${student.name} has already checked in today.`,
      });
      return;
    }

    const newRecord: AttendanceRecord = {
      studentId: student.id,
      checkInTime: new Date(),
      date: new Date().toISOString(),
    };

    setAttendanceRecords((prevRecords) => [...prevRecords, newRecord]);
    toast({
      title: "Check-in Successful",
      description: `${student.name} has been successfully checked in.`,
    });
  }, [students, attendanceRecords, toast]);

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Header />
      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 flex flex-col gap-8">
              <RfidScanner onCheckIn={handleCheckIn} />
              <AttendanceAnalytics attendanceRecords={attendanceRecords} students={students} />
            </div>
            <div className="lg:col-span-2">
              <AttendanceTable students={students} attendanceRecords={attendanceRecords} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Home;
