import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold">Student Management System</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Click the button below to add a new student.
        </p>
        <Button asChild className="mt-6">
          <Link href="/student/add">Add New Student</Link>
        </Button>
      </div>
    </main>
  );
}
