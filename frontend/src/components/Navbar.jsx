import React, { useEffect, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  LayoutDashboard,
  LogOut,
  Menu,
  QrCode,
  Search,
  Sparkles,
  Ticket,
  Users,
  X,
  CalendarDays,
  Webhook as WebhookIcon,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Logo } from './Logo';
import { Button } from './ui/Button';
import { Avatar, AvatarFallback } from './ui/Avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/DropdownMenu';
import { cn, initials } from '../lib/utils';

function navLinks(user) {
  const links = [
    { to: '/', label: 'Discover', icon: CalendarDays, end: true },
    { to: '/agenda', label: 'Agenda', icon: Sparkles },
  ];
  if (user) links.push({ to: '/tickets', label: 'My Tickets', icon: Ticket });
  if (user && (user.role === 'Organizer' || user.role === 'Admin')) {
    links.push({ to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard });
    links.push({ to: '/webhooks', label: 'Webhooks', icon: WebhookIcon });
  }
  if (user && (user.role === 'Exhibitor' || user.role === 'Organizer' || user.role === 'Admin')) {
    links.push({ to: '/leads', label: 'Leads', icon: Users });
  }
  if (user) links.push({ to: '/scanner', label: 'Scanner', icon: QrCode });
  return links;
}

const linkClass = ({ isActive }) =>
  cn(
    'group flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold tracking-display transition-all duration-200',
    isActive
      ? 'bg-primary/12 text-primary'
      : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
  );

export function Navbar({ onOpenCommand }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const links = navLinks(user);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="glass sticky top-0 z-40 border-b border-border/70">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link to="/" className="shrink-0" aria-label="EMS Platform home">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Primary">
          {links.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
              <link.icon className="h-4 w-4" />
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenCommand}
            className="hidden items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2 text-sm font-medium text-muted-foreground shadow-surface transition-all hover:border-border-strong hover:text-foreground md:flex"
            aria-label="Search events"
          >
            <Search className="h-4 w-4" />
            <span className="hidden lg:inline">Search events…</span>
            <kbd className="hidden rounded-lg border border-border bg-surface-3 px-1.5 py-0.5 font-mono text-[10px] lg:inline">
              ⌘K
            </kbd>
          </button>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="rounded-full ring-primary transition hover:ring-2 focus-visible:outline-none focus-visible:ring-2"
                  aria-label="Account menu"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="normal-case tracking-normal">
                  <span className="block text-sm font-semibold text-foreground">{user.name}</span>
                  <span className="block text-xs font-normal text-muted-foreground">{user.email}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/tickets')}>
                  <Ticket className="h-4 w-4" /> My Tickets
                </DropdownMenuItem>
                {user.role === 'Organizer' || user.role === 'Admin' ? (
                  <>
                    <DropdownMenuItem onSelect={() => navigate('/dashboard')}>
                      <LayoutDashboard className="h-4 w-4" /> Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/webhooks')}>
                      <WebhookIcon className="h-4 w-4" /> Webhooks
                    </DropdownMenuItem>
                  </>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={handleLogout}
                  className="text-danger focus:bg-danger/10 focus:text-danger"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                Sign in
              </Button>
              <Button size="sm" onClick={() => navigate('/register')}>
                Get started
              </Button>
            </div>
          )}

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-surface-2 text-foreground shadow-surface lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md data-[state=open]:animate-fade-in lg:hidden" />
          <DialogPrimitive.Content className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] border-l border-border-strong bg-surface-1 p-5 shadow-overlay data-[state=open]:animate-fade-in lg:hidden">
            <DialogPrimitive.Title className="sr-only">Navigation menu</DialogPrimitive.Title>
            <div className="flex items-center justify-between">
              <Logo />
              <DialogPrimitive.Close
                className="rounded-xl p-2 text-muted-foreground transition hover:bg-surface-2 hover:text-foreground"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </DialogPrimitive.Close>
            </div>

            <nav className="mt-6 flex flex-col gap-1">
              {links.map((link, i) => (
                <motion.div
                  key={link.to}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.25 }}
                >
                  <NavLink
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold tracking-display transition-colors',
                        isActive
                          ? 'bg-primary/12 text-primary'
                          : 'text-muted-foreground hover:bg-surface-2 hover:text-foreground',
                      )
                    }
                  >
                    <link.icon className="h-4 w-4" />
                    {link.label}
                  </NavLink>
                </motion.div>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenCommand?.();
              }}
              className="mt-4 flex w-full items-center gap-2 rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-sm text-muted-foreground"
            >
              <Search className="h-4 w-4" /> Search events…
            </button>

            <div className="mt-6 border-t border-border pt-4">
              {user ? (
                <Button variant="secondary" className="w-full" onClick={handleLogout}>
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Button variant="secondary" onClick={() => navigate('/login')}>
                    Sign in
                  </Button>
                  <Button onClick={() => navigate('/register')}>Get started</Button>
                </div>
              )}
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </header>
  );
}