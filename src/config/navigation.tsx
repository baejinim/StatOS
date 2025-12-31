import React from "react";

import { FileText2 } from "@/components/icons/FileText2";
import { Home } from "@/components/icons/Home";
import { IconProps } from "@/components/icons/types";
// feature flags removed for non-writing features

export interface NavigationItem {
  id: string;
  label: string;
  href: string;
  icon: React.ComponentType<IconProps>;
  keywords?: string[];
  isActive?: (pathname: string) => boolean;
  section?: "main" | "projects";
  feature?: string;
}

export const navigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    href: "/",
    icon: Home,
    keywords: ["home", "dashboard"],
    isActive: (pathname) => pathname === "/",
    section: "main",
  },
  {
    id: "writing",
    label: "Writing",
    href: "/writing",
    icon: FileText2,
    keywords: ["writing", "blog", "posts"],
    isActive: (pathname) => pathname.startsWith("/writing"),
    section: "projects",
  },
];

// Helper functions to filter navigation items
export const getMainNavigationItems = () =>
  navigationItems.filter((item) => item.section === "main");

export const getProjectNavigationItems = () =>
  navigationItems.filter((item) => item.section === "projects");

export const getAllNavigationItems = () => navigationItems;
