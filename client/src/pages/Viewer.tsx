import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { decodeWebX } from "@/lib/webx";
import { WebXRenderer } from "@/components/webx/Renderer";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, ArrowLeft, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Viewer() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Extract payload from URL query params manually since wouter doesn't parse them automatically
  const searchParams = new URLSearchParams(window.location.search);
  const payload = searchParams.get("payload");
  
  const blueprint = payload ? decodeWebX(payload) : null;

  const handleCopyLink = () => {
      navigator.clipboard.writeText(window.location.href);
      toast({
          title: "Link Copied",
          description: "Share this WebX page with anyone."
      });
  };

  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Alert variant="destructive" className="max-w-md border-destructive/50 bg-destructive/10 text-destructive-foreground">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            No WebX payload found in URL. 
            <br />
            <Button variant="link" className="px-0 text-foreground mt-2" onClick={() => setLocation("/")}>
               Return Home
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!blueprint) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Alert variant="destructive" className="max-w-md border-destructive/50 bg-destructive/10 text-destructive-foreground">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Invalid Payload</AlertTitle>
          <AlertDescription>
            The WebX payload could not be decoded. It may be corrupted or invalid.
             <br />
            <Button variant="link" className="px-0 text-foreground mt-2" onClick={() => setLocation("/")}>
               Return Home
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary selection:text-white pb-20">
      <div className="fixed top-0 left-0 w-full p-4 z-50 flex justify-between items-center pointer-events-none">
         <Button 
            variant="ghost" 
            size="sm" 
            className="pointer-events-auto backdrop-blur-md bg-background/50 hover:bg-background/80 border border-white/10"
            onClick={() => setLocation("/")}
         >
            <ArrowLeft className="w-4 h-4 mr-2" /> Home
         </Button>

         <div className="flex gap-2 pointer-events-auto">
            <Button 
                variant="outline" 
                size="sm"
                className="backdrop-blur-md bg-background/50 border-white/10"
                onClick={handleCopyLink}
            >
                <Copy className="w-4 h-4 mr-2" /> Share
            </Button>
         </div>
      </div>

      {/* The Page Content */}
      <WebXRenderer blueprint={blueprint} className="pt-16" />
    </div>
  );
}
