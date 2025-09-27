"use client";

import type { FC } from "react";
import React, { useState, useEffect } from "react";
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
import { Key, Copy, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ApiKeyManager: FC = () => {
  const [apiKey, setApiKey] = useState("");
  const [hasCopied, setHasCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchApiKey = async () => {
      setIsLoading(true);
      try {
        const apiKeyDocRef = doc(db, "settings", "apiKey");
        const docSnap = await getDoc(apiKeyDocRef);
        if (docSnap.exists()) {
          setApiKey(docSnap.data().key);
        }
      } catch (error) {
        console.error("Failed to fetch API key:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not fetch the API key from Firestore.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchApiKey();
  }, [toast]);

  const generateAndSaveApiKey = async () => {
    setIsGenerating(true);
    const randomBytes = new Uint8Array(16);
    window.crypto.getRandomValues(randomBytes);
    const key = Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    try {
        const apiKeyDocRef = doc(db, "settings", "apiKey");
        await setDoc(apiKeyDocRef, { key: key });
        setApiKey(key);
        setHasCopied(false);
        toast({
            title: "Success!",
            description: "New API Key generated and saved.",
        });
    } catch (error) {
        console.error("Failed to save API key:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save the API key to Firestore.",
        });
    } finally {
        setIsGenerating(false);
    }
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
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Key className="h-6 w-6 text-primary" />
          </div>
          <div>
            <CardTitle>
              API Key Manager
            </CardTitle>
            <CardDescription>
              Manage the API key for your hardware.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-4">
        <div className="flex items-center space-x-2">
            <Input
              id="apikey"
              placeholder={isLoading ? "Loading key..." : "Generate a new key"}
              value={apiKey}
              readOnly
              disabled={isLoading || isGenerating}
            />
            <Button
                variant="outline"
                size="icon"
                onClick={copyToClipboard}
                disabled={!apiKey || isLoading || isGenerating}
                aria-label="Copy API Key"
            >
                {hasCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
        </div>
        <p className="text-xs text-muted-foreground">
            Use this key in your ESP8266 device code to authenticate with the API.
        </p>
      </CardContent>
      <CardFooter>
        <Button onClick={generateAndSaveApiKey} className="w-full" disabled={isGenerating || isLoading}>
          {isGenerating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isGenerating ? "Generating..." : "Generate & Save New Key"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ApiKeyManager;
