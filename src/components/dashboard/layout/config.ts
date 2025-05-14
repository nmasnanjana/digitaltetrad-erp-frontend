import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';
import {Money} from "@phosphor-icons/react/dist/ssr/Money";
import {CheckCircle} from "@phosphor-icons/react/dist/ssr/CheckCircle";
import {CreditCard} from "@phosphor-icons/react/dist/ssr/CreditCard";

export const navItems = [
  { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie',
    items: [
      {key: 'expenseDashboard', title: 'Expense Overview', href: paths.dashboard.expenseDashboard, icon: 'chart-pie'},
    ]
  },
  //{ key: 'integrations', title: 'Integrations', href: paths.dashboard.integrations, icon: 'plugs-connected' },
  //{ key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'gear-six' },
  { key: 'user', title: 'User Management', href: paths.dashboard.user, icon: 'user' },
  { key: 'team', title: 'Team Management', href: paths.dashboard.team, icon: 'users' },
  { key: 'customer', title: 'Customer Management', href: paths.dashboard.customer, icon: 'users' },
  { key: 'job', title: 'Job Management', href: paths.dashboard.job, icon: 'WorkOutlineIcon' },
  { key: 'expense', title: 'Expense Management', href: paths.dashboard.expense, icon: 'Money',
    items: [
      {key: 'expenseApproval', title: 'Expense Approval', href: paths.dashboard.expenseApproval, icon: 'CheckCircle'},
      {key: 'expensePayment', title: 'Payment Management', href: paths.dashboard.expensePayment, icon: 'CreditCard'},
    ]
  },
  //{ key: 'error', title: 'Error', href: paths.errors.notFound, icon: 'x-square' },
] satisfies NavItemConfig[];
