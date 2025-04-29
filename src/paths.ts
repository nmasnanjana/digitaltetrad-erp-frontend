export const paths = {
  home: '/',
  auth: { signIn: '/auth/sign-in', signUp: '/auth/sign-up', resetPassword: '/auth/reset-password' },
  dashboard: {
    overview: '/dashboard',
    account: '/dashboard/account',
    customers: '/dashboard/customers',
    integrations: '/dashboard/integrations',
    settings: '/dashboard/settings',
    user: '/dashboard/user',
    userCreation: '/dashboard/userCreation',
    userEdit: (id: string) => `/dashboard/user/${id}`,
    team: '/dashboard/team',
    teamCreation: '/dashboard/teamCreation',
    teamEdit: (id: string) => `/dashboard/team/${id}`,
  },
  errors: { notFound: '/errors/not-found' },
} as const;
