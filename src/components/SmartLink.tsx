import { Link } from "@tanstack/react-router";
import { forwardRef, ReactNode, AnchorHTMLAttributes } from "react";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: string;
  children?: ReactNode;
};

/**
 * Renders a TanStack <Link> for internal routes (supports ?query strings)
 * and a plain <a> for external URLs (http/https/mailto/tel).
 */
export const SmartLink = forwardRef<HTMLAnchorElement, Props>(function SmartLink(
  { to, children, ...rest },
  ref,
) {
  const isExternal = /^(https?:|mailto:|tel:)/i.test(to);
  if (isExternal) {
    return (
      <a ref={ref} href={to} target={to.startsWith("http") ? "_blank" : undefined} rel="noreferrer noopener" {...rest}>
        {children}
      </a>
    );
  }
  const [path, query] = to.split("?");
  const search = query ? Object.fromEntries(new URLSearchParams(query)) : undefined;
  return (
    <Link ref={ref} to={path as any} search={search as any} {...(rest as any)}>
      {children}
    </Link>
  );
});
