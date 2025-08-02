export interface NavItemConfig {
  key: string;
  title?: string;
  disabled?: boolean;
  external?: boolean;
  label?: string;
  icon?: string;
  href?: string;
  items?: NavItemConfig[];
  // Matcher cannot be a function in order
  // to be able to use it on the server.
  // If you need to match multiple paths,
  // can extend it to accept multiple matchers.
  matcher?: { type: 'startsWith' | 'equals'; href: string };
  permission?: {
    module: string;
    action: string;
  };
}

export interface NavSection {
  title: string;
  items: NavItemConfig[];
}

export interface NavConfig {
  sections: NavSection[];
}
