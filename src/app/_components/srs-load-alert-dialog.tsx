"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useSRS } from "@/lib/srs";

export default function SRSLoadAlertDialog() {
  const { error, reset } = useSRS();

  return (
    <AlertDialog open={error !== undefined}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Oh no!</AlertDialogTitle>
          <AlertDialogDescription>
            <span className="font-bold mb-1 block">{error}</span>
            It looks like there was an error loading your local data.
            Unfortunately, we can't recover from this. Reset your browser local
            storage?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction asChild>
            <Button variant="destructive" onClick={reset}>
              Reset Local Storage
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
