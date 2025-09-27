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
import { ScanLine, Loader2 } from "lucide-react";

interface RfidScannerProps {
  onCheckIn: (rfid: string) => Promise<void> | void;
}

const RfidScanner: FC<RfidScannerProps> = ({ onCheckIn }) => {
  const [rfid, setRfid] = useState("");
  const [isCheckingIn, setIsCheckingIn] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rfid.trim() && !isCheckingIn) {
      setIsCheckingIn(true);
      await onCheckIn(rfid.trim());
      setRfid("");
      setIsCheckingIn(false);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <ScanLine className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>
              Manual RFID Check-in
            </CardTitle>
            <CardDescription>
              Enter a student's RFID to log attendance.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
        <CardContent className="flex-grow">
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="rfid">Student RFID</Label>
              <Input
                id="rfid"
                placeholder="Scan or type RFID..."
                value={rfid}
                onChange={(e) => setRfid(e.target.value)}
                autoFocus
                disabled={isCheckingIn}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={!rfid.trim() || isCheckingIn}>
            {isCheckingIn && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCheckingIn ? "Checking In..." : "Check In"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default RfidScanner;
