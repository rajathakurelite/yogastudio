import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui";

const studentLinks = [
  { to: "/dashboard", label: "Home", short: "Home" },
  { to: "/daily-yoga", label: "Daily Yoga", short: "Daily" },
  { to: "/classes", label: "Explore", short: "Explore" },
  { to: "/schedule", label: "Schedule", short: "Schedule" },
  { to: "/history", label: "History", short: "History" },
];

const instructorLinks = [
  { to: "/instructor/dashboard", label: "Dashboard", short: "Home" },
  { to: "/instructor/classes/create", label: "Create class", short: "Create" },
  { to: "/classes", label: "Catalog", short: "Catalog" },
];

const adminLinks = [
  { to: "/admin", label: "Admin", short: "Admin" },
  { to: "/instructor/dashboard", label: "Instructor", short: "Teach" },
  { to: "/classes", label: "Classes", short: "Classes" },
];

export default function AppShell() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const links = hasRole("admin")
    ? adminLinks
    : hasRole("instructor")
      ? instructorLinks
      : studentLinks;
  const homeTo = hasRole("admin")
    ? "/admin"
    : hasRole("instructor")
      ? "/instructor/dashboard"
      : "/dashboard";

  function signOut() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-sand/80 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:py-4">
          <NavLink to={homeTo} className="min-w-0 shrink font-serif text-xl text-sage-deep sm:text-2xl">
            Yoga Studio
          </NavLink>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  isActive ? "text-sage-deep" : "text-sage hover:text-sage-deep"
                }
                end={l.to === "/dashboard" || l.to === "/instructor/dashboard" || l.to === "/admin"}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NavLink
              to="/profile"
              className="hidden max-w-[10rem] truncate text-sm text-sage md:block"
            >
              {user?.fullName}
            </NavLink>
            <Button
              variant="secondary"
              className="hidden px-4 py-2 md:inline-flex"
              onClick={signOut}
            >
              Sign out
            </Button>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-sand bg-white text-sage-deep md:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="sr-only">Menu</span>
              <span aria-hidden="true" className="text-lg leading-none">
                {menuOpen ? "×" : "☰"}
              </span>
            </button>
          </div>
        </div>
        {menuOpen ? (
          <div className="border-t border-sand/60 bg-cream px-4 py-4 md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1">
              <NavLink
                to="/profile"
                className="rounded-xl px-3 py-3 text-sm text-sage-deep"
                onClick={() => setMenuOpen(false)}
              >
                {user?.fullName || "Profile"}
              </NavLink>
              {links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-3 text-sm ${isActive ? "bg-sage-mist text-sage-deep" : "text-sage"}`
                  }
                  end={l.to === "/dashboard"}
                  onClick={() => setMenuOpen(false)}
                >
                  {l.label}
                </NavLink>
              ))}
              <button
                type="button"
                className="mt-2 rounded-xl px-3 py-3 text-left text-sm text-clay"
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
              >
                Sign out
              </button>
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-sand/80 bg-cream/95 backdrop-blur md:hidden"
        aria-label="Primary"
      >
        <div
          className="safe-pb mx-auto grid max-w-6xl gap-0 px-1 pt-2"
          style={{
            gridTemplateColumns: `repeat(${Math.min(links.length, 4) + 1}, minmax(0, 1fr))`,
          }}
        >
          {links.slice(0, 4).map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/dashboard" || l.to === "/instructor/dashboard" || l.to === "/admin"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center rounded-xl px-1 py-2 text-center text-[11px] font-medium leading-tight ${
                  isActive ? "text-sage-deep" : "text-sage"
                }`
              }
            >
              <span className="max-w-full truncate">{l.short}</span>
            </NavLink>
          ))}
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `flex flex-col items-center justify-center rounded-xl px-1 py-2 text-center text-[11px] font-medium leading-tight ${
                isActive ? "text-sage-deep" : "text-sage"
              }`
            }
          >
            Profile
          </NavLink>
        </div>
      </nav>
    </div>
  );
}
