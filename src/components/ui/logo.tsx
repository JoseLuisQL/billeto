import { cn } from "@/lib/utils";
import React from "react";

export function BilletoIcon({
    className,
    ...props
}: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            fill="none" // Ensure we use fill="none" for the SVG container
            className={cn("size-8 text-primary shrink-0", className)}
            {...props}
        >
            {/* 
        Professional Fintech "B" 
        A geometric, solid construction suggesting stability (vertical pillar) 
        and flexibility (curved loops). 
        The "Notch" or separation between the spine and loops adds a modern tech feel.
      */}

            {/* Vertical Spine - The Foundation */}
            <rect x="4" y="4" width="7" height="24" rx="2" className="fill-current" />

            {/* Top Loop - The Action */}
            <path
                d="M13 4H19C23.4183 4 27 7.58172 27 12C27 16.4183 23.4183 20 19 20H13V4Z"
                className="fill-current"
            />

            {/* Bottom Loop - The Growth (Offset to create the B shape, extending further down) */}
            <path
                d="M13 16H20C24.4183 16 28 19.5817 28 24C28 28.4183 24.4183 32 20 32H13V16Z"
                className="fill-current"
            />

            {/* Negative space cleanup (optional, but overlapping filled shapes work well for solid logos) */}
        </svg>
    );
}

export function BilletoLogo({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                "flex items-center font-bold text-2xl tracking-tighter select-none text-primary",
                className
            )}
            {...props}
        >
            <BilletoIcon className="size-8 mb-1" />
            <span className="hidden sm:inline-block -ml-0.5">illeto</span>
        </div>
    );
}
