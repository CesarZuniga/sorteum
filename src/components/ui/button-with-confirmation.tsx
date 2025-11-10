"use client"

import {
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

export function ButtonWithConfirmation({
  confirmationText,
  cancelText,
  ...props
}: React.ComponentProps<typeof Button> & {
  confirmationText: string
  cancelText: string
}) {
  return (
    <>
      <AlertDialogCancel>{cancelText}</AlertDialogCancel>
      <AlertDialogAction asChild>
        <Button {...props}>{confirmationText}</Button>
      </AlertDialogAction>
    </>
  )
}
