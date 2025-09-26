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
import { KeyRound, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ApiKeyManager: FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const { toast } = useToast();

  const generateApiKey = () => {
    // Generate a secure random 32-character hex string
    const randomBytes = new Uint8Array(16);
    window.crypto.getRandomValues(randomBytes);
    const key = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setApiKey(key);
    setHasCopied(false);
  };

  const copyToClipboard = () => {
    if (!apiKey) return;
    navigator.clipboard.writeText(apiKey).then(() => {
      setHasCopied(true);
      toast({
        title: "Copied!",
        description: "API Key has been copied to your clipboard.",
      });
      setTimeout(() => setHasCopied(false), 2000); // Reset icon after 2s
    }).catch(err => {
        console.error("Failed to copy API key:", err);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not copy the API key.",
        });
    });
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline">
          <KeyRound className="h-6 w-6" />
          API Key Manager
        </CardTitle>
        <CardDescription>
          Generate a secure API key for your ESP8266 device.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
            <Input
            id="apikey"
            placeholder="Click generate to create a key"
            value={apiKey}
            readOnly
            />
            <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                disabled={!apiKey}
                aria-label="Copy API Key"
            >
                {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
        <p className="text-xs text-muted-foreground">
            Copy this key and add it to your <code className="bg-muted px-1 py-0.5 rounded">.env.local</code> file as <code className="bg-muted px-1 py-0.5 rounded">ESP8266_API_KEY</code> and also to your ESP8266 code.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={generateApiKey} className="w-full">
          Generate New Key
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyManager;
