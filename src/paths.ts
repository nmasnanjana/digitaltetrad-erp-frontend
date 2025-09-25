export interface PathConfig {
  home: string;
  auth: {
    signIn: string;
    signUp: string;
    resetPassword: string;
    jwt: {
      login: string;
      register: string;
    };
    login: string;
    register: string;
    forgotPassword: string;
  };
  dashboard: {
    overview: string;
    account: string;
    integrations: string;
    settings: string;
    user: string;
    role: string;
    permission: string;
    userCreation: string;
    userEdit: (id: string) => string;
    team: string;
    teamCreation: string;
    teamEdit: (id: string) => string;
    customer: string;
    job: string;
    inventory: string;
    expense: string;
    expenseDashboard: string;
    expenseApproval: string;
    expensePayment: string;
    expenseType: string;
    operationType: string;
    expenseView: (id: string) => string;
    expenseEdit: (id: string) => string;
    invoiceGenerator: string;
    viewInvoices: string;
    ericssonRateCard: string;
    zteRateCard: string;
  };
  errors: {
    notFound: string;
  };
}

export const paths: PathConfig = {
  home: '/',
  auth: { 
    signIn: '/auth/sign-in', 
    signUp: '/auth/sign-up', 
    resetPassword: '/auth/reset-password', 
    jwt: { 
      login: '/auth/jwt/login', 
      register: '/auth/jwt/register' 
    }, 
    login: '/auth/login', 
    register: '/auth/register', 
    forgotPassword: '/auth/forgot-password' 
  },
  dashboard: {
    overview: '/dashboard',
    account: '/dashboard/account',
    integrations: '/dashboard/integrations',
    settings: '/dashboard/settings',
    user: '/dashboard/user',
    role: '/dashboard/role',
    permission: '/dashboard/permission',
    userCreation: '/dashboard/userCreation',
    userEdit: (id: string) => `/dashboard/user/${id}`,
    team: '/dashboard/team',
    teamCreation: '/dashboard/teamCreation',
    teamEdit: (id: string) => `/dashboard/team/${id}`,
    customer: '/dashboard/customer',
    job: '/dashboard/job',
    inventory: '/dashboard/inventory',
    expense: '/dashboard/expense',
    expenseDashboard: '/dashboard/expenseDashboard',
    expenseApproval: '/dashboard/expense/approval',
    expensePayment: '/dashboard/expense/payment',
    expenseType: '/dashboard/expense/type',
    operationType: '/dashboard/expense/operation-type',
    expenseView: (id: string) => `/dashboard/expense/${id}/view`,
    expenseEdit: (id: string) => `/dashboard/expense/${id}/edit`,
    invoiceGenerator: '/dashboard/invoice-generator',
    viewInvoices: '/dashboard/view-invoices',
    ericssonRateCard: '/dashboard/ericsson-rate-card',
    zteRateCard: '/dashboard/zte-rate-card',
  },
  errors: { notFound: '/errors/404' },
} as const;
