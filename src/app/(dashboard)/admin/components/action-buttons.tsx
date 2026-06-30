"use client";

import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import { approveListing, rejectListing } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";

interface ActionButtonProps {
  listingId: string;
}

export function ApproveButton({ listingId }: ActionButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleApprove = async () => {
    const confirmed = confirm("Are you sure you want to APPROVE this listing and schedule the auction block?");
    if (!confirmed) return;

    setIsPending(true);
    const result = await approveListing(listingId);
    if (!result.success) {
      alert(`Approval failed: ${result.error}`);
    }
    setIsPending(false);
  };

  return (
    <Button
      onClick={handleApprove}
      disabled={isPending}
      size="sm"
      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium gap-1.5 h-8 px-3 rounded-lg active:scale-95 transition-all cursor-pointer"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Check className="h-3.5 w-3.5" />
      )}
      Approve
    </Button>
  );
}

export function RejectButton({ listingId }: ActionButtonProps) {
  const [isPending, setIsPending] = useState(false);

  const handleReject = async () => {
    const notes = prompt("Enter moderation feedback / reason for rejection (minimum 5 characters):");
    if (notes === null) return; // user cancelled prompt

    if (notes.trim().length < 5) {
      alert("Rejection notes must be at least 5 characters long.");
      return;
    }

    setIsPending(true);
    const result = await rejectListing(listingId, notes);
    if (!result.success) {
      alert(`Rejection failed: ${result.error}`);
    }
    setIsPending(false);
  };

  return (
    <Button
      onClick={handleReject}
      disabled={isPending}
      variant="outline"
      size="sm"
      className="border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 text-destructive font-medium gap-1.5 h-8 px-3 rounded-lg active:scale-95 transition-all cursor-pointer"
    >
      {isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <X className="h-3.5 w-3.5" />
      )}
      Reject
    </Button>
  );
}
