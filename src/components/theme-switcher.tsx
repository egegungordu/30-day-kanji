"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { themes, Theme } from "@/lib/themes";
import { SelectLabel } from "@radix-ui/react-select";
import { cn } from "@/lib/utils";
import { RiPaletteLine } from "react-icons/ri";

function ThemeSelectItem({ theme }: { theme: Theme }) {
  return (
    <SelectItem key={theme.name} value={theme.name} className="h-7">
      <div
        className={cn(
          theme.name,
          "text-xs flex items-center gap-0.5 bg-background text-primary font-semibold rounded-full px-2 py-0.5 ring-1 ring-inset ring-ring/50",
        )}
      >
        {/* <div */}
        {/*   className={cn( */}
        {/*     theme.name, */}
        {/*     "size-1.5 rounded-full bg-primary shrink-0", */}
        {/*   )} */}
        {/* /> */}
        {/* <div */}
        {/*   className={cn( */}
        {/*     theme.name, */}
        {/*     "size-1.5 rounded-full bg-secondary shrink-0 mr-1", */}
        {/*   )} */}
        {/* /> */}

        {theme.displayName}
      </div>
    </SelectItem>
  );
}

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted ? (
    <Select onValueChange={setTheme} defaultValue={theme} value={theme}>
      <SelectTrigger showChevron={false} className="size-9 flex items-center justify-center text-xs px-0 rounded-full text-muted-foreground hover:bg-muted animate-in fade-in-0 zoom-in-125 ease-in-out">
        <RiPaletteLine className="size-5" />
      </SelectTrigger>
      <SelectContent align="center">
        <SelectGroup>
          <SelectLabel className="font-semibold text-muted-foreground text-xs px-2">
            Dark
          </SelectLabel>
          {themes
            .filter((theme) => theme.theme === "dark")
            .map((theme) => (
              <ThemeSelectItem key={theme.name} theme={theme} />
            ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel className="font-semibold text-muted-foreground text-xs px-2">
            Light
          </SelectLabel>
          {themes
            .filter((theme) => theme.theme === "light")
            .map((theme) => (
              <ThemeSelectItem key={theme.name} theme={theme} />
            ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  ) : <div className="size-9" />;
}
