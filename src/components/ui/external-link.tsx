import React from "react"
import { RiExternalLinkLine } from "react-icons/ri"

const ExternalLink = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> 

>(({ className, children, ...props }, ref) => (
  <a
    ref={ref}
    rel="noreferrer"
    target="_blank"
    className={`${className} text-primary underline hover:opacity-80`}
    {...props}
  >
    {children}
    <RiExternalLinkLine className="inline-block align-text-bottom ml-1" />
  </a>
))

export default ExternalLink

