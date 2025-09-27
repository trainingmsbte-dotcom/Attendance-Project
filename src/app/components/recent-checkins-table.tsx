"use client";

import type { FC } from "react";
import React from "react";
import type { Student, AttendanceRecord } from "@/app/lib/data";
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
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

interface RecentCheckinsTableProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
}


const RecentCheckinsTable: FC<RecentCheckinsTableProps> = ({
  students,
  attendanceRecords,
}) => {
    
  const getStudentName = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : "Unknown Student";
  }

  const sortedRecords = [...attendanceRecords].sort((a, b) => new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime());

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Check-ins</CardTitle>
        <CardDescription>A real-time log of the latest student check-ins.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
            <div className="border rounded-md">
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-right">Check-in Time</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sortedRecords.length > 0 ? (
                    sortedRecords.map((record, index) => (
                    <TableRow key={`${record.studentId}-${index}`}>
                        <TableCell className="font-medium">{getStudentName(record.studentId)}</TableCell>
                        <TableCell className="text-right">
                            {format(new Date(record.checkInTime), "p")}
                        </TableCell>
                    </TableRow>
                    ))
                ) : (
                    <TableRow>
                    <TableCell colSpan={2} className="h-24 text-center">
                        No check-ins recorded yet today.
                    </TableCell>
                    </TableRow>
                )}
                </TableBody>
            </Table>
            </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentCheckinsTable;