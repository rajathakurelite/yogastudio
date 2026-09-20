import { Link, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui";

export default function MarketingLayout() {
  const { isAuthenticated, homePath } = useAuth();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-sand/60 bg-cream/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="font-serif text-2xl text-sage-deep">
            Yoga Studio
          </Link>
          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a href="#daily-yoga" className="text-sage hover:text-sage-deep">
              Daily Yoga
            </a>
            <a href="#classes" className="text-sage hover:text-sage-deep">
              Classes
            </a>
            <a href="#how-it-works" className="text-sage hover:text-sage-deep">
              How it works
            </a>
            <a href="#instructors" className="text-sage hover:text-sage-deep">
              Instructors
            </a>
          </nav>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <Link to={homePath()}>
                <Button>Open app</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Sign in</Button>
                </Link>
                <Link to="/register">
                  <Button>Get started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-sand/80 bg-sage-deep px-4 py-12 text-cream">
        <div className="mx-auto flex max-w-6xl flex-col gap-8 md:flex-row md:justify-between">
          <div>
            <p className="font-serif text-2xl">Yoga Studio</p>
            <p className="mt-2 max-w-sm text-sm text-sand">
              Movement, breath, and balance — for students and instructors. General wellness only; not medical advice.
            </p>
          </div>
          <div className="flex gap-12 text-sm">
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
        <p className="mx-auto mt-10 max-w-6xl text-xs text-sand/80">yogastudio.airepro.in</p>
      </footer>
    </div>
  );
}
