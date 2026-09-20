import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../components/ui";

const studentLinks = [
  { to: "/dashboard", label: "Home" },
  { to: "/daily-yoga", label: "Daily Yoga" },
  { to: "/classes", label: "Explore" },
  { to: "/schedule", label: "Schedule" },
  { to: "/history", label: "History" },
];

const instructorLinks = [
  { to: "/instructor/dashboard", label: "Dashboard" },
  { to: "/instructor/classes/create", label: "Create class" },
  { to: "/classes", label: "Catalog" },
];

const adminLinks = [
  { to: "/admin", label: "Admin" },
  { to: "/instructor/dashboard", label: "Instructor" },
  { to: "/classes", label: "Classes" },
];

export default function AppShell() {
  const { user, logout, hasRole } = useAuth();
  const navigate = useNavigate();
  const links = hasRole("admin")
    ? adminLinks
    : hasRole("instructor")
      ? instructorLinks
      : studentLinks;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-sand/80 bg-cream/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <NavLink
            to={hasRole("admin") ? "/admin" : hasRole("instructor") ? "/instructor/dashboard" : "/dashboard"}
            className="font-serif text-2xl"
          >
            Yoga Studio
          </NavLink>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) => (isActive ? "text-sage-deep" : "text-sage hover:text-sage-deep")}
                end={l.to === "/dashboard"}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <NavLink to="/profile" className="hidden text-sm md:block">
              {user?.fullName}
            </NavLink>
            <Button
              variant="secondary"
              onClick={() => {
                logout();
                navigate("/login");
              }}
            >
              Sign out
            </Button>
          </div>
        </div>
        <div className="flex gap-4 overflow-auto px-4 pb-3 text-sm md:hidden">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="whitespace-nowrap text-sage">
              {l.label}
            </NavLink>
          ))}
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
