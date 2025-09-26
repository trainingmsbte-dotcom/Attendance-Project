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
