"use client";

import type { FC } from "react";
import React, {
  useState,
  useEffect,
  useMemo,
} from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  orderBy
} from "firebase/firestore";
import {
  db
} from "@/lib/firebase";
import type {
  Student,
  AttendanceRecord
} from "@/app/lib/data";
import Header from "@/app/components/header";
import { Sidebar, SidebarContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Receipt, School, LayoutDashboard } from "lucide-react";
import RecentCheckinsTable from "@/app/components/recent-checkins-table";


const TransactionsPage: FC = () => {
  const [students, setStudents] = useState < Student[] > ([]);
  const [rawRfidScans, setRawRfidScans] = useState<{ uid: string; timestamp: Date }[]>([]);

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

  return (
    <div className="flex flex-col min-h-screen bg-muted/40 text-foreground">
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
                    <SidebarMenuButton href="/dashboard">
                        <LayoutDashboard />
                        Dashboard
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton href="/transactions" isActive>
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

export default TransactionsPage;
