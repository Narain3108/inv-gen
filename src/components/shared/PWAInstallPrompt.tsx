"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function PWAInstallPrompt() {
  const [isReadyForInstall, setIsReadyForInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      // Update UI notify the user they can install the PWA
      setIsReadyForInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // If it was already installed, you might want to hide the prompt
    window.addEventListener("appinstalled", () => {
      setIsReadyForInstall(false);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  async function downloadApp() {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;
    
    // We've used the prompt, and can't use it again, throw it away
    setDeferredPrompt(null);
    setIsReadyForInstall(false);
  }

  return (
    <Dialog open={isReadyForInstall} onOpenChange={setIsReadyForInstall}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Install Invoice App</DialogTitle>
          <DialogDescription>
            Install our application to your home screen for quick and easy access, offline support, and a better experience.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center p-4">
          <img src="/loo.jpg" alt="App Logo" className="w-24 h-24 rounded-2xl shadow-sm" />
        </div>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="secondary" onClick={() => setIsReadyForInstall(false)}>
            Close
          </Button>
          <Button type="button" onClick={downloadApp}>
            Install App
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
