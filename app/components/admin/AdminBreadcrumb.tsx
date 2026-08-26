"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  ADMIN_ROOT_HREF,
  ADMIN_ROOT_LABEL,
  findAdminNavMatch,
  getAdminSubPathLabel,
} from "@/app/admin/admin-nav";

type Crumb = {
  href: string;
  label: string;
};

function buildAdminBreadcrumbs(pathname: string): Crumb[] {
  const navMatch = findAdminNavMatch(pathname);
  if (!navMatch) {
    return [{ href: ADMIN_ROOT_HREF, label: ADMIN_ROOT_LABEL }];
  }

  const subLabel = getAdminSubPathLabel(pathname, navMatch.href);

  if (navMatch.href === ADMIN_ROOT_HREF) {
    if (subLabel) {
      return [
        { href: ADMIN_ROOT_HREF, label: ADMIN_ROOT_LABEL },
        { href: pathname, label: subLabel },
      ];
    }
    return [{ href: ADMIN_ROOT_HREF, label: navMatch.label }];
  }

  const crumbs: Crumb[] = [
    { href: ADMIN_ROOT_HREF, label: ADMIN_ROOT_LABEL },
    { href: navMatch.href, label: navMatch.label },
  ];

  if (subLabel) {
    crumbs.push({ href: pathname, label: subLabel });
  }

  return crumbs;
}

export function AdminBreadcrumb() {
  const pathname = usePathname();
  const crumbs = buildAdminBreadcrumbs(pathname);

  return (
    <nav aria-label="麵包屑導航" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <li
              key={`${index}-${crumb.label}`}
              className="flex min-w-0 items-center gap-1"
            >
              {index > 0 ? (
                <ChevronRight
                  className="size-3 shrink-0 text-text-disabled"
                  aria-hidden="true"
                />
              ) : null}
              {isLast ? (
                <span
                  className="truncate font-sans text-[13px] font-semibold text-text-primary"
                  aria-current="page"
                >
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="truncate font-sans text-[12px] font-medium text-text-secondary transition-colors hover:text-brand active:scale-[0.98]"
                >
                  {crumb.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
