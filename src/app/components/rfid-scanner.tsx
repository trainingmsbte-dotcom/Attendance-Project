"use client";

import type { FC } from "react";
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScanLine } from "lucide-react";

interface RfidScannerProps {
  onCheckIn: (rfid: string) => void;
}

const RfidScanner: FC<RfidScannerProps> = ({ onCheckIn }) => {
  const [rfid, setRfid] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rfid.trim()) {
      onCheckIn(rfid.trim());
      setRfid("");
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <ScanLine className="h-6 w-6" />
          RFID Check-in
        </CardTitle>
        <CardDescription>
          Scan student RFID card or enter the ID manually to record attendance.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="rfid">RFID</Label>
              <Input
                id="rfid"
                placeholder="e.g., RFID001"
                value={rfid}
                onChange={(e) => setRfid(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={!rfid.trim()}>
            Check In
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RfidScanner;
