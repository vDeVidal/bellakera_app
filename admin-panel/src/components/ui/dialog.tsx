import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onOpenChange(false)
        }
        if (open) {
            document.addEventListener("keydown", handleEsc)
            document.body.style.overflow = "hidden"
        }
        return () => {
            document.removeEventListener("keydown", handleEsc)
            document.body.style.overflow = ""
        }
    }, [open, onOpenChange])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => onOpenChange(false)}
            />
            <div className="relative z-50">{children}</div>
        </div>
    )
}

export function DialogContent({
    className,
    children,
    onClose,
}: {
    className?: string
    children: React.ReactNode
    onClose?: () => void
}) {
    return (
        <div
            className={cn(
                "relative bg-background border border-border rounded-lg shadow-lg max-w-lg w-full mx-4 p-6",
                className
            )}
        >
            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 opacity-70 hover:opacity-100"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
            {children}
        </div>
    )
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("mb-4", className)} {...props} />
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h2 className={cn("text-lg font-semibold", className)} {...props} />
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn("text-sm text-muted-foreground", className)} {...props} />
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn("mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2", className)}
            {...props}
        />
    )
}