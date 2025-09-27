"use client"

import type { FC } from "react"
import React, { useMemo } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from "recharts"
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
import { Tally3 } from "lucide-react"

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

      data.push({
        date: format(date, "eee"),
        present: presentStudents,
      });
    }
    return data;
  }, [attendanceRecords]);

  const chartConfig = {
    present: {
      label: "Present",
      color: "hsl(var(--primary))",
    },
  } satisfies ChartConfig

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Tally3 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>Weekly Attendance</CardTitle>
            <CardDescription>Number of students present over the last 7 days.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={10}
                axisLine={false}
                tickFormatter={(value) => value}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis
                allowDecimals={false}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <ChartTooltip
                cursor={false}
                content={<ChartTooltipContent 
                  formatter={(value) => `${value} students`}
                  indicator="dot"
                />}
              />
              <Bar dataKey="present" fill="var(--color-present)" radius={4} />
            </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

export default AttendanceAnalytics
