"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon, Loader2 } from "lucide-react";
import { createClient } from "@/lib/api";
import type { Client } from "@/types";

interface AddClientDialogProps {
  onClientCreated?: () => void;
  onClientAdded?: (client: Client) => void;
}

export function AddClientDialog({ onClientCreated, onClientAdded }: AddClientDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) {
      setError("Client name is required");
      return;
    }

    if (!website.trim()) {
      setError("Website URL is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createClient({
        name: name.trim(),
        website: website.trim(),
        notes: notes.trim() || undefined,
      });

      // Success - reset and close
      setOpen(false);
      setName("");
      setWebsite("");
      setNotes("");
      onClientCreated?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create client");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Client</DialogTitle>
          <DialogDescription>
            Create a new client profile to track their security scans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Client Name *</Label>
            <Input
              id="name"
              placeholder="Acme Corporation Pty Ltd"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="website">Website URL *</Label>
            <Input
              id="website"
              placeholder="example.com or https://example.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              disabled={loading}
            />
            <p className="text-muted-foreground text-xs">
              Enter domain name or full URL
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="WordPress + WooCommerce, hosted on SiteGround..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
