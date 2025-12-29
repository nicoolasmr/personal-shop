import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> {
    animate?: boolean;
    indicatorClassName?: string;
}

const Progress = React.forwardRef<React.ElementRef<typeof ProgressPrimitive.Root>, ProgressProps>(
    ({ className, value, animate = false, indicatorClassName, ...props }, ref) => {
        // Basic shim for simpler usage if Radix Progress is not fully installed but using the same API structure
        // If installed, this wraps nicely. Assuming npm install @radix-ui/react-progress will be run.
        return (
            <ProgressPrimitive.Root
                ref={ref}
                className={cn(
                    "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
                    className
                )}
                {...props}
            >
                <ProgressPrimitive.Indicator
                    className={cn(
                        "h-full w-full flex-1 bg-primary transition-all",
                        indicatorClassName
                    )}
                    style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
                />
            </ProgressPrimitive.Root>
        );
    }
);
Progress.displayName = ProgressPrimitive.Root.displayName;

export { Progress };
