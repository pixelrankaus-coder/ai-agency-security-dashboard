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
import { createSite } from "@/lib/api";
import type { Site } from "@/types";

interface AddSiteDialogProps {
  onSiteCreated?: () => void;
  onSiteAdded?: (site: Site) => void;
}

export function AddSiteDialog({
  onSiteCreated,
  onSiteAdded,
}: AddSiteDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!url.trim()) {
      setError("URL is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const newSite = await createSite({
        url: url.trim(),
        name: name.trim() || undefined,
        notes: notes.trim() || undefined,
      });

      // Success - reset and close
      setOpen(false);
      setUrl("");
      setName("");
      setNotes("");
      onSiteCreated?.();
      onSiteAdded?.(newSite);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create site");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusIcon className="mr-2 h-4 w-4" />
          Add Site
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add New Site</DialogTitle>
          <DialogDescription>
            Add a website to monitor its security with regular scans.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="url">Website URL *</Label>
            <Input
              id="url"
              placeholder="https://example.com"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={loading}
            />
            <p className="text-muted-foreground text-xs">
              Enter the full URL or domain name
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Site Name (Optional)</Label>
            <Input
              id="name"
              placeholder="Main Website"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
            <p className="text-muted-foreground text-xs">
              Friendly name to identify this site
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
            Add Site
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
