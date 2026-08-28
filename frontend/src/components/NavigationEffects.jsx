import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

const getTitle = (pathname) => {
  if (pathname === "/") return "TaskFlow — Calm, visual project planning";
  if (pathname === "/signin") return "Sign in — TaskFlow";
  if (pathname === "/signup") return "Create an account — TaskFlow";
  if (pathname === "/dashboard") return "Workspaces — TaskFlow";
  if (pathname.startsWith("/organizations/")) return "Workspace — TaskFlow";
  if (pathname.startsWith("/board/")) return "Board — TaskFlow";
  return "Page not found — TaskFlow";
};

const focusPageHeading = () => {
  const heading = document.querySelector("#main-content h1");
  if (!(heading instanceof HTMLElement)) return false;

  heading.setAttribute("tabindex", "-1");
  heading.focus({ preventScroll: true });
  heading.addEventListener(
    "blur",
    () => {
      heading.removeAttribute("tabindex");
    },
    { once: true },
  );
  return true;
};

const NavigationEffects = () => {
  const { pathname } = useLocation();
  const firstRoute = useRef(true);

  useEffect(() => {
    document.title = getTitle(pathname);
    window.scrollTo(0, 0);

    if (firstRoute.current) {
      firstRoute.current = false;
      return undefined;
    }

    if (focusPageHeading()) return undefined;

    const root = document.getElementById("root");
    if (!root) return undefined;

    const observer = new MutationObserver(() => {
      if (focusPageHeading()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 2500);

    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [pathname]);

  return null;
};

export default NavigationEffects;
