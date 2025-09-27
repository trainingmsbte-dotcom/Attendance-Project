"use client";

import type { FC } from "react";
import { Users, UserCheck, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Student, AttendanceRecord } from "@/lib/data";

interface StatsProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
}

const Stats: FC<StatsProps> = ({ students, attendanceRecords }) => {
  const totalStudents = students.length;
  const presentStudents = new Set(attendanceRecords.map(r => r.studentId)).size;
  const absentStudents = totalStudents - presentStudents;

  const statItems = [
    {
      title: "Total Students",
      value: totalStudents,
      icon: <Users className="h-6 w-6 text-muted-foreground" />,
    },
    {
      title: "Present",
      value: presentStudents,
      icon: <UserCheck className="h-6 w-6 text-green-500" />,
    },
    {
      title: "Absent",
      value: absentStudents,
      icon: <UserX className="h-6 w-6 text-red-500" />,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {statItems.map((item) => (
        <Card key={item.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
            {item.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Stats;
