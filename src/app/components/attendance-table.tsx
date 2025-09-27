"use client";

import type { FC } from "react";
import React, { useState, useMemo } from "react";
import type { Student, AttendanceRecord } from "@/lib/data";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AttendanceTableProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
}

type AttendanceStatus = "Present" | "Absent";

interface DisplayRecord {
  id: string;
  name: string;
  status: AttendanceStatus;
  checkInTime: string | null;
}

const AttendanceTable: FC<AttendanceTableProps> = ({
  students,
  attendanceRecords,
}) => {
  const [filter, setFilter] = useState<"all" | "present" | "absent">("all");

  const displayData: DisplayRecord[] = useMemo(() => {
    const presentStudentIds = new Set(
      attendanceRecords.map((r) => r.studentId)
    );

    let allStudentsWithStatus = students.map((student) => {
      const isPresent = presentStudentIds.has(student.id);
      const record = isPresent
        ? attendanceRecords.find((r) => r.studentId === student.id)
        : null;
      return {
        id: student.id,
        name: student.name,
        status: isPresent ? "Present" : ("Absent" as AttendanceStatus),
        checkInTime: record ? format(new Date(record.checkInTime), "p") : null,
      };
    });

    if (filter === "present") {
      return allStudentsWithStatus.filter((s) => s.status === "Present");
    }
    if (filter === "absent") {
      return allStudentsWithStatus.filter((s) => s.status === "Absent");
    }
    return allStudentsWithStatus.sort((a, b) => {
      if (a.status === 'Present' && b.status === 'Absent') return -1;
      if (a.status === 'Absent' && b.status === 'Present') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [students, attendanceRecords, filter]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>Today's Attendance</CardTitle>
                <CardDescription>A real-time log of student check-ins for {format(new Date(), "MMMM d, yyyy")}.</CardDescription>
            </div>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="present">Present</TabsTrigger>
              <TabsTrigger value="absent">Absent</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent>
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student Name</TableHead>
                <TableHead>Check-in Time</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.length > 0 ? (
                displayData.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.name}</TableCell>
                    <TableCell>{record.checkInTime ?? "N/A"}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={record.status === "Present" ? "default" : "secondary"}
                        className={
                          record.status === "Present"
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    No records to display.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceTable;
