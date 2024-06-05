import ThemeSwitcher from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-between p-6 sm:p-12 max-w-screen-md mx-auto">
      <ThemeSwitcher />

      <h1 className="text-5xl sm:text-7xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-br from-secondary via-primary to-secondary py-2">
        30 Day Kanji
      </h1>

      <p className="text-center mt-6 max-w-lg tracking-tight">
        This is the 30 day kanji learning challenge. The goal is to learn how to
        write all{" "}
        <span className="font-bold text-primary">2,136 常用漢字 </span>(jouyou
        kanji) in 30 days.
      </p>

      <div className="text-muted-foreground text-sm mt-1 tracking-tight text-center">
        Intended for people who already know how to read Japanese.
      </div>

      <Link href="/app" className="mt-4">
        <Button>Start the challenge</Button>
      </Link>

      <div className="mt-2 text-muted-foreground text-sm underline tracking-tight">
        No login required!
      </div>
    </main>
  );
}
