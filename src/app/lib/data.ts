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

// A simple pseudo-random number generator for deterministic results
const LCG = (seed: number) => () => (seed = (seed * 1664525 + 1013904223) & 0x7fffffff) / 0x7fffffff;

function generatePastAttendance(): AttendanceRecord[] {
    const records: AttendanceRecord[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day for consistency

    for (let i = 1; i <= 7; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        initialStudents.forEach((student, index) => {
            const seed = (date.getDate() * 100) + index;
            const pseudoRandom = LCG(seed);
            
            // Simulate deterministic attendance
            if (pseudoRandom() > 0.2) { // 80% chance
                const checkInTime = new Date(date);
                checkInTime.setHours(8 + Math.floor(pseudoRandom() * 2), Math.floor(pseudoRandom() * 60), Math.floor(pseudoRandom() * 60));
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


// Generate some initial records for today deterministically
function generateTodayAttendance(): AttendanceRecord[] {
    const records: AttendanceRecord[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of day for consistency
    const studentSubset = initialStudents.slice(0, 7);

    studentSubset.forEach((student, index) => {
        const seed = (today.getDate() * 200) + index;
        const pseudoRandom = LCG(seed);
        
        if(pseudoRandom() > 0.1) { // 90% of this subset
          const checkInTime = new Date(); // Use current time for today's records but deterministic part is just for initial render
          checkInTime.setHours(8, Math.floor(pseudoRandom() * 60), Math.floor(pseudoRandom() * 60));
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
