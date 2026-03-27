import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface CalendarProps {
  mode?: "single"
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  disabled?: (date: Date) => boolean
  initialFocus?: boolean
  className?: string
  "data-testid"?: string
}

function Calendar({
  selected,
  onSelect,
  disabled,
  className,
  ...props
}: CalendarProps) {
  const [viewDate, setViewDate] = React.useState(selected || new Date())

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1))
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1))

  const days: { date: Date; isCurrentMonth: boolean }[] = []

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month - 1, daysInPrevMonth - i), isCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true })
  }
  const remaining = 42 - days.length
  for (let d = 1; d <= remaining; d++) {
    days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false })
  }

  const isSelected = (date: Date) =>
    selected && date.toDateString() === selected.toDateString()

  const isToday = (date: Date) =>
    date.toDateString() === new Date().toDateString()

  const isDisabled = (date: Date) => disabled ? disabled(date) : false

  return (
    <div className={cn("p-3", className)} data-testid={props["data-testid"]}>
      <div className="flex justify-between items-center mb-3">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{monthNames[month]} {year}</span>
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-0">
        {dayNames.map(d => (
          <div key={d} className="h-9 w-9 flex items-center justify-center text-[0.8rem] text-muted-foreground font-normal">
            {d}
          </div>
        ))}
        {days.map(({ date, isCurrentMonth }, i) => {
          const sel = isSelected(date)
          const today = isToday(date)
          const dis = isDisabled(date)
          return (
            <button
              key={i}
              type="button"
              disabled={dis}
              onClick={() => !dis && onSelect?.(date)}
              className={cn(
                "h-9 w-9 rounded-md text-sm flex items-center justify-center transition-colors",
                !isCurrentMonth && "text-muted-foreground opacity-40",
                isCurrentMonth && !sel && !today && "hover:bg-accent hover:text-accent-foreground",
                today && !sel && "bg-accent text-accent-foreground",
                sel && "bg-primary text-primary-foreground",
                dis && "opacity-30 cursor-not-allowed"
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
export type { CalendarProps }
