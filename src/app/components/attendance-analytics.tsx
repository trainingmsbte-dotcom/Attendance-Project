"use client"

import type { FC } from "react"
import React, { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { format, subDays, startOfDay } from "date-fns"

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import type { AttendanceRecord, Student } from "@/lib/data"

interface AttendanceAnalyticsProps {
  attendanceRecords: AttendanceRecord[]
  students: Student[]
}

const AttendanceAnalytics: FC<AttendanceAnalyticsProps> = ({ attendanceRecords, students }) => {
  const chartData = useMemo(() => {
    const data = [];
    const today = startOfDay(new Date());

    for (let i = 6; i >= 0; i--) {
      const date = subDays(today, i);
      const dateString = date.toISOString().split("T")[0];
      
      const recordsOnDate = attendanceRecords.filter(record => record.date.startsWith(dateString));
      const presentStudents = new Set(recordsOnDate.map(r => r.studentId)).size;
      const totalStudents = students.length;
      const presentPercentage = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0;

      data.push({
        date: format(date, "eee"),
        present: presentPercentage,
      });
    }
    return data;
  }, [attendanceRecords, students]);

  const chartConfig = {
    present: {
      label: "Present (%)",
      color: "hsl(var(--chart-2))",
    },
  } satisfies ChartConfig

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline">Weekly Attendance Summary</CardTitle>
        <CardDescription>Percentage of students present over the last 7 days.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[200px] w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent 
                formatter={(value) => `${Number(value).toFixed(1)}%`}
                indicator="dot"
              />}
            />
            <Bar dataKey="present" fill="var(--color-present)" radius={4} key="present" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default AttendanceAnalytics
