import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'overview', title: 'Overview', href: paths.dashboard.overview, icon: 'chart-pie',
    items: [
      {key: 'expenseDashboard', title: 'Expense Overview', href: paths.dashboard.expenseDashboard, icon: 'chart-pie'},
    ]
  },
  { key: 'user', title: 'User Management', href: paths.dashboard.user, icon: 'user' },
  { key: 'role', title: 'Role Management', href: paths.dashboard.role, icon: 'shield' },
  { key: 'permission', title: 'Permission Management', href: paths.dashboard.permission, icon: 'fingerprint' },
  { key: 'team', title: 'Team Management', href: paths.dashboard.team, icon: 'users' },
  { key: 'customer', title: 'Customer Management', href: paths.dashboard.customer, icon: 'users' },
  { key: 'job', title: 'Job Management', href: paths.dashboard.job, icon: 'WorkOutlineIcon' },
  { key: 'inventory', title: 'Inventory Management', href: paths.dashboard.inventory, icon: 'TreasureChest' },
  { key: 'expense', title: 'Expense Management', href: paths.dashboard.expense, icon: 'Money',
    items: [
      {key: 'expenseApproval', title: 'Expense Approval', href: paths.dashboard.expenseApproval, icon: 'CheckCircle'},
      {key: 'expensePayment', title: 'Payment Management', href: paths.dashboard.expensePayment, icon: 'CreditCard'},
    ]
  },
  { key: 'invoiceGenerator', title: 'Invoice Generator', href: paths.dashboard.invoiceGenerator, icon: 'invoice' },
  { key: 'viewInvoices', title: 'Invoices', href: paths.dashboard.viewInvoices, icon: 'receipt' },
  { key: 'ericssonRateCard', title: 'Ericsson Rate Cards', href: paths.dashboard.ericssonRateCard, icon: 'receipt' },
  { key: 'zteRateCard', title: 'ZTE Rate Cards', href: paths.dashboard.zteRateCard, icon: 'receipt' },
  { key: 'settings', title: 'Settings', href: paths.dashboard.settings, icon: 'settings' },
] satisfies NavItemConfig[];
