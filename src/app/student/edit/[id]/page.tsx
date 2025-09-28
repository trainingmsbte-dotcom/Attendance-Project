
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  uid: z.string().min(4, {
    message: "UID must be at least 4 characters.",
  }),
  className: z.string().min(1, {
    message: "Class name is required.",
  }),
});

export default function EditStudentPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      uid: "",
      className: "",
    },
  });

  useEffect(() => {
    if (studentId) {
      const fetchStudent = async () => {
        try {
          const studentDoc = await getDoc(doc(db, "students", studentId));
          if (studentDoc.exists()) {
            const studentData = studentDoc.data();
            form.reset({
              name: studentData.name,
              uid: studentData.uid,
              className: studentData.className,
            });
          } else {
            toast({
              variant: "destructive",
              title: "Not Found",
              description: "Student data not found.",
            });
            router.push("/");
          }
        } catch (error) {
          console.error("Error fetching student:", error);
          toast({
            variant: "destructive",
            title: "Uh oh! Something went wrong.",
            description: "There was a problem fetching student data.",
          });
        } finally {
          setLoading(false);
        }
      };
      fetchStudent();
    }
  }, [studentId, form, router, toast]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (!db) {
        throw new Error("Firestore database is not available.");
      }
      const studentRef = doc(db, "students", studentId);
      await updateDoc(studentRef, {
        name: values.name,
        uid: values.uid,
        className: values.className,
      });

      toast({
        title: "Success!",
        description: "The student has been updated.",
      });
      router.push("/");
    } catch (error) {
      console.error("Error updating document: ", error);
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: "There was a problem updating the student. Please try again.",
      });
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-24">
       <div className="w-full max-w-md">
        <Button asChild variant="ghost" className="mb-4">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Edit Student</CardTitle>
            <CardDescription>
              Update the details for this student.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full mt-4" />
              </div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="uid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RFID UID</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. 1A2B3C4D" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="className"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Grade 10" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">Save Changes</Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

