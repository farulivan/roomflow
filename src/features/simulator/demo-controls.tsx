import { FlaskConical, Loader2, RotateCcw, Zap } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useCurrentHotel } from "@/features/hotels/current-hotel"
import { updateDemoSettings } from "@/lib/demo-settings"
import { useDemoSettings } from "@/lib/use-demo-settings"

import { useCreateIncomingOrder, useResetDemoData } from "./mutations"

interface DemoSwitchRowProps {
  label: string
  description: string
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  switchClassName?: string
}

function DemoSwitchRow({
  label,
  description,
  checked,
  onCheckedChange,
  switchClassName,
}: DemoSwitchRowProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-0.5">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={label}
        className={switchClassName}
      />
    </div>
  )
}

/**
 * Header popover exposing every demo lever: automatic incoming orders,
 * simulated slow network, simulated API failures, plus one-off triggers.
 * Reads settings live via useDemoSettings; writes go straight through
 * updateDemoSettings, which the mock API's handlers already read.
 */
export function DemoControls() {
  const hotel = useCurrentHotel()
  const settings = useDemoSettings()
  const createIncomingOrder = useCreateIncomingOrder()
  const resetDemoData = useResetDemoData()

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Demo controls">
          <FlaskConical className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold">Demo controls</p>
          <p className="text-xs text-muted-foreground">
            Simulate real-world conditions.
          </p>
        </div>

        <div className="space-y-3">
          <DemoSwitchRow
            label="New orders"
            description="A new request arrives automatically"
            checked={settings.autoOrders}
            onCheckedChange={(checked) =>
              updateDemoSettings({ autoOrders: checked })
            }
          />
          <DemoSwitchRow
            label="Slow network"
            description="Add multi-second latency"
            checked={settings.network === "slow"}
            onCheckedChange={(checked) =>
              updateDemoSettings({ network: checked ? "slow" : "normal" })
            }
          />
          <DemoSwitchRow
            label="API errors"
            description="Fail every request"
            checked={settings.failRequests}
            onCheckedChange={(checked) =>
              updateDemoSettings({ failRequests: checked })
            }
            switchClassName="data-checked:bg-destructive"
          />
        </div>

        <Separator />

        <div className="space-y-1.5">
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            disabled={createIncomingOrder.isPending}
            onClick={() =>
              createIncomingOrder.mutate(hotel.id, {
                onError: () =>
                  toast.error("Couldn't send a demo order", {
                    description: settings.failRequests
                      ? "Simulated API errors are on, so every request fails."
                      : "Check your connection and try again.",
                  }),
              })
            }
          >
            {createIncomingOrder.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <Zap />
            )}
            Send order now
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full justify-start"
            disabled={resetDemoData.isPending}
            onClick={() => resetDemoData.mutate()}
          >
            {resetDemoData.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RotateCcw />
            )}
            Reset demo data
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
