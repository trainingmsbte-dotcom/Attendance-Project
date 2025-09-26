export interface Student {
  id: string;
  name: string;
  rfid: string;
}

export interface AttendanceRecord {
  studentId: string;
  checkInTime: Date;
  date: string; // ISO string
}

export const initialStudents: Student[] = [
  { id: "1", name: "Alice Johnson", rfid: "RFID001" },
  { id: "2", name: "Bob Williams", rfid: "RFID002" },
  { id: "3", name: "Charlie Brown", rfid: "RFID003" },
  { id: "4", name: "Diana Miller", rfid: "RFID004" },
  { id: "5", name: "Ethan Davis", rfid: "RFID005" },
  { id: "6", name: "Fiona Garcia", rfid: "RFID006" },
  { id: "7", name: "George Rodriguez", rfid: "RFID007" },
  { id: "8", name: "Hannah Wilson", rfid: "RFID008" },
  { id: "9", name: "Ian Martinez", rfid: "RFID009" },
  { id: "10", name: "Jane Anderson", rfid: "RFID010" },
];

function generatePastAttendance(): AttendanceRecord[] {
    const records: AttendanceRecord[] = [];
    const today = new Date();
    
    for (let i = 1; i <= 7; i++) { // Generate for last 7 days
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        initialStudents.forEach(student => {
            // Simulate random attendance
            if (Math.random() > 0.2) { // 80% chance of being present
                const checkInTime = new Date(date);
                checkInTime.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
                records.push({
                    studentId: student.id,
                    checkInTime: checkInTime,
                    date: checkInTime.toISOString(),
                });
            }
        });
    }
    return records;
}


// Generate some initial records for today
function generateTodayAttendance(): AttendanceRecord[] {
    const records: AttendanceRecord[] = [];
    const today = new Date();
    const studentSubset = initialStudents.slice(0, 7); // Let's say 7 students are present today

    studentSubset.forEach(student => {
        if(Math.random() > 0.1) { // 90% of this subset
          const checkInTime = new Date(today);
          checkInTime.setHours(8, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
          records.push({
              studentId: student.id,
              checkInTime: checkInTime,
              date: checkInTime.toISOString(),
          });
        }
    });

    return records;
}


export const initialAttendanceRecords: AttendanceRecord[] = [
    ...generatePastAttendance(),
    ...generateTodayAttendance(),
];
