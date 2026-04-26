'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Route } from 'next';
import type { CurrentUserDto } from '@acme/shared';
import { Badge, Button, Separator, cn } from '@acme/ui';

import { OrganizationSwitcher } from '@/components/organization-switcher';
import { SignOutButton } from '@/components/sign-out-button';

type IconProps = {
  className?: string;
  'data-icon'?: 'inline-start' | 'inline-end';
  'aria-hidden'?: boolean;
};

type IconComponent = (props: IconProps) => React.JSX.Element;

export type HeaderNavItem =
  | { href: Route; label: string; requiresPrivilege?: boolean; kind?: 'page' }
  | { href: `/${string}`; label: string; requiresPrivilege?: boolean; kind: 'link' };

const routeIcons: Record<string, IconComponent> = {
  '/': GridIcon,
  '/health': PulseIcon,
  '/users': TeamIcon,
  '/api/v1/docs': DocsIcon,
};

export function HeaderMenu({
  currentUser,
  navItems,
}: {
  currentUser: CurrentUserDto | null;
  navItems: HeaderNavItem[];
}) {
  const pathname = usePathname();
  const menuId = useId();
  const menuRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const workspaceLabel = useMemo(() => {
    if (!currentUser) {
      return 'Explore platform';
    }

    if (currentUser.organization) {
      return currentUser.organization.name;
    }

    if (currentUser.organizations.length > 0) {
      return 'Choose workspace';
    }

    return 'Finish onboarding';
  }, [currentUser]);

  const workspaceHint = useMemo(() => {
    if (!currentUser) {
      return 'Navigation';
    }

    if (currentUser.organization && currentUser.role) {
      return `${currentUser.role} access`;
    }

    if (currentUser.organization) {
      return 'Active workspace';
    }

    if (currentUser.organizations.length > 0) {
      return 'Select your workspace';
    }

    return 'Workspace setup';
  }, [currentUser]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="relative flex w-full justify-end sm:w-auto">
      <Button
        variant="secondary"
        size="lg"
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className="w-full min-w-0 justify-between rounded-full border border-white/10 bg-white/6 px-4 text-left text-slate-100 shadow-[0_18px_50px_rgba(2,6,23,0.24)] hover:bg-white/12 sm:w-auto sm:min-w-[17rem]"
        onClick={() => {
          setIsOpen((open) => !open);
        }}
      >
        <MenuIcon data-icon="inline-start" />
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold">{workspaceLabel}</span>
          <span className="truncate text-[11px] uppercase tracking-[0.2em] text-slate-400">
            {workspaceHint}
          </span>
        </span>
        <ChevronIcon
          data-icon="inline-end"
          className={cn('transition-transform duration-200', isOpen && 'rotate-180')}
        />
      </Button>

      {isOpen ? (
        <div
          id={menuId}
          role="dialog"
          aria-label="Header menu"
          className="header-menu-panel absolute right-0 top-[calc(100%+0.8rem)] z-30 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/94 shadow-[0_32px_90px_rgba(2,6,23,0.5)] backdrop-blur-2xl"
        >
          <div className="flex flex-col gap-5 p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-start gap-3">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400/14 text-cyan-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  {currentUser ? (
                    currentUser.user.email.slice(0, 1).toUpperCase()
                  ) : (
                    <SparkleIcon className="size-4" />
                  )}
                </div>
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-semibold text-white">
                    {currentUser ? currentUser.user.email : 'Everything in one menu'}
                  </p>
                  <p className="text-sm leading-6 text-slate-400">
                    {currentUser?.organization
                      ? `Currently working inside ${currentUser.organization.name}.`
                      : currentUser && currentUser.organizations.length > 0
                        ? 'You have access to workspaces, but none is active yet.'
                        : currentUser
                          ? 'Create or join a workspace from onboarding.'
                          : 'Jump between the main sections without filling the header with links.'}
                  </p>
                </div>
              </div>
              {currentUser?.role ? (
                <Badge className="shrink-0 border border-cyan-400/20 bg-cyan-400/10 text-cyan-100">
                  {currentUser.role}
                </Badge>
              ) : null}
            </div>

            <Separator className="bg-white/10" />

            <nav aria-label="Primary" className="flex flex-col gap-2">
              {navItems.map((item) => {
                const Icon = routeIcons[item.href] ?? GridIcon;
                const isActive =
                  item.kind === 'link'
                    ? false
                    : item.href === '/'
                      ? pathname === '/'
                      : pathname === item.href || pathname?.startsWith(`${item.href}/`);

                const itemClassName = cn(
                  'header-menu-link',
                  isActive && 'header-menu-link--active',
                );
                const itemContent = (
                  <>
                    <span className="flex items-center gap-3">
                      <span className="flex size-9 items-center justify-center rounded-2xl bg-white/6 text-slate-200">
                        <Icon className="size-4" />
                      </span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
                      Open
                    </span>
                  </>
                );

                if (item.kind === 'link') {
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      onClick={() => {
                        setIsOpen(false);
                      }}
                      className={itemClassName}
                    >
                      {itemContent}
                    </a>
                  );
                }

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => {
                      setIsOpen(false);
                    }}
                    className={itemClassName}
                  >
                    {itemContent}
                  </Link>
                );
              })}
            </nav>

            {currentUser ? (
              <>
                <Separator className="bg-white/10" />

                {currentUser.organizations.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-white">Workspace</p>
                        <p className="text-sm text-slate-400">
                          {currentUser.organizations.length > 1
                            ? 'Switch organizations from here instead of carrying the selector in the header.'
                            : 'Your active organization stays here so the top bar can stay minimal.'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-white/10 bg-white/5 text-slate-300"
                      >
                        {currentUser.organizations.length} org
                        {currentUser.organizations.length === 1 ? '' : 's'}
                      </Badge>
                    </div>
                    <OrganizationSwitcher
                      organizations={currentUser.organizations}
                      currentOrganizationId={currentUser.organization?.id ?? null}
                      currentOrganizationName={currentUser.organization?.name ?? null}
                      forceVisible
                      showLabel={false}
                      className="min-w-0"
                      onSwitchComplete={() => {
                        setIsOpen(false);
                      }}
                    />
                  </div>
                ) : (
                  <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                    <Link
                      className="font-semibold text-cyan-200 hover:text-cyan-100"
                      href="/onboarding"
                    >
                      Continue onboarding
                    </Link>{' '}
                    to create or join a workspace.
                  </div>
                )}

                <Separator className="bg-white/10" />

                <SignOutButton className="w-full justify-center" />
              </>
            ) : (
              <>
                <Separator className="bg-white/10" />

                <div className="grid gap-2 sm:grid-cols-2">
                  <Link
                    href={'/sign-in' as never}
                    onClick={() => {
                      setIsOpen(false);
                    }}
                  >
                    <Button variant="secondary" className="w-full justify-center">
                      Sign in
                    </Button>
                  </Link>
                  <Link
                    href={'/sign-up' as never}
                    onClick={() => {
                      setIsOpen(false);
                    }}
                  >
                    <Button className="w-full justify-center">Create account</Button>
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MenuIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M10 17h10" />
    </svg>
  );
}

function ChevronIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function SparkleIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
      <path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14Z" />
    </svg>
  );
}

function GridIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <rect x="4" y="4" width="6" height="6" rx="1.2" />
      <rect x="14" y="4" width="6" height="6" rx="1.2" />
      <rect x="4" y="14" width="6" height="6" rx="1.2" />
      <rect x="14" y="14" width="6" height="6" rx="1.2" />
    </svg>
  );
}

function PulseIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M3 12h4l2.5-5 3 10 2.5-5H21" />
    </svg>
  );
}

function TeamIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M16.5 10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      <path d="M3.5 19a4.5 4.5 0 0 1 9 0" />
      <path d="M13 18a3.5 3.5 0 0 1 7 0" />
    </svg>
  );
}

function DocsIcon(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M7 4.5h7l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 19V6A1.5 1.5 0 0 1 7.5 4.5Z" />
      <path d="M14 4.5V8h3.5" />
      <path d="M9 12h6" />
      <path d="M9 15.5h6" />
    </svg>
  );
}
