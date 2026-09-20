import { useState } from "react";
import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui";

const NAV = [
  { href: "#daily-yoga", label: "Daily Yoga" },
  { href: "#classes", label: "Classes" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#instructors", label: "Instructors" },
];

export default function MarketingLayout() {
  const { isAuthenticated, homePath } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="sticky top-0 z-30 border-b border-sand/60 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <Link to="/" className="shrink-0 font-serif text-xl text-sage-deep sm:text-2xl">
            Yoga Studio
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            {NAV.map((item) => (
              <a key={item.href} href={item.href} className="text-sage hover:text-sage-deep">
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-1 sm:gap-2">
            {isAuthenticated ? (
              <Link to={homePath()}>
                <Button className="px-4 py-2 text-sm sm:px-5">Open app</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden sm:block">
                  <Button variant="ghost" className="px-3 py-2">
                    Sign in
                  </Button>
                </Link>
                <Link to="/register">
                  <Button className="px-4 py-2 text-sm sm:px-5">Get started</Button>
                </Link>
              </>
            )}
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-white text-sage-deep md:hidden"
              aria-expanded={open}
              aria-label={open ? "Close menu" : "Open menu"}
              onClick={() => setOpen((v) => !v)}
            >
              <span aria-hidden="true">{open ? "×" : "☰"}</span>
            </button>
          </div>
        </div>
        {open ? (
          <div className="border-t border-sand/50 bg-cream px-4 py-3 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              {NAV.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded-xl px-3 py-3 text-sm text-sage-deep"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              {!isAuthenticated ? (
                <Link
                  to="/login"
                  className="rounded-xl px-3 py-3 text-sm text-sage sm:hidden"
                  onClick={() => setOpen(false)}
                >
                  Sign in
                </Link>
              ) : null}
            </div>
          </div>
        ) : null}
      </header>
      <Outlet />
      <footer className="border-t border-sand/80 bg-sage-deep px-4 py-10 text-cream sm:py-12">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:justify-between">
          <div>
            <p className="font-serif text-2xl">Yoga Studio</p>
            <p className="mt-2 max-w-sm text-sm text-sand">
              Movement, breath, and balance — for students and instructors. General wellness only;
              not medical advice.
            </p>
          </div>
          <div className="flex flex-wrap gap-10 text-sm sm:gap-12">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-sand">Practice</p>
              <Link to="/register" className="block hover:text-white">
                Join Daily Yoga
              </Link>
              <Link to="/login" className="block hover:text-white">
                Sign in
              </Link>
            </div>
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-sand">Teach</p>
              <Link to="/register" className="block hover:text-white">
                Become an instructor
              </Link>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-8 max-w-6xl text-xs text-sand/80 sm:mt-10">
          yogastudio.airepro.in
        </p>
      </footer>
    </div>
  );
}
