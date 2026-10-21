import { describe, expect, mock, test } from "bun:test"
import { act, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "sonner"

import { ThemeProvider } from "@/components/theme-provider"

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "./sheet"
import { Toaster } from "./sonner"

describe("Sheet", () => {
  test("a toast shown over an open sheet can be closed, and the sheet stays open", async () => {
    const user = userEvent.setup()
    const onOpenChange = mock()

    render(
      <ThemeProvider>
        <Toaster closeButton />
        <Sheet open onOpenChange={onOpenChange}>
          <SheetContent>
            <SheetTitle>HL-1042</SheetTitle>
            <SheetDescription>Order details</SheetDescription>
          </SheetContent>
        </Sheet>
      </ThemeProvider>
    )
    act(() => {
      toast("Order HL-1042 acknowledged", { duration: Infinity })
    })

    await user.click(await screen.findByRole("button", { name: "Close toast" }))

    // Sonner marks a dismissed toast right away and unmounts it after its
    // exit animation, which the test DOM doesn't run.
    await waitFor(() =>
      expect(
        screen
          .getByText("Order HL-1042 acknowledged")
          .closest("[data-sonner-toast]")
      ).toHaveAttribute("data-removed", "true")
    )
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})
