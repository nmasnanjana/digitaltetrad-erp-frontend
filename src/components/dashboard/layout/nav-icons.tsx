import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { ChartPie as ChartPieIcon } from '@phosphor-icons/react/dist/ssr/ChartPie';
import { GearSix as GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { PlugsConnected as PlugsConnectedIcon } from '@phosphor-icons/react/dist/ssr/PlugsConnected';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { XSquare } from '@phosphor-icons/react/dist/ssr/XSquare';
import { Briefcase } from '@phosphor-icons/react/dist/ssr/Briefcase';
import { Money } from '@phosphor-icons/react/dist/ssr/Money';
import { CheckCircle } from '@phosphor-icons/react/dist/ssr/CheckCircle';
import { CreditCard } from "@phosphor-icons/react/dist/ssr/CreditCard";
import { Shield } from '@phosphor-icons/react/dist/ssr/Shield';

export const navIcons = {
  'chart-pie': ChartPieIcon,
  'gear-six': GearSixIcon,
  'plugs-connected': PlugsConnectedIcon,
  'x-square': XSquare,
  user: UserIcon,
  users: UsersIcon,
  'WorkOutlineIcon': Briefcase,
  'Money': Money,
  'CheckCircle': CheckCircle,
  'CreditCard': CreditCard,
  'shield':Shield,
} as Record<string, Icon>;
