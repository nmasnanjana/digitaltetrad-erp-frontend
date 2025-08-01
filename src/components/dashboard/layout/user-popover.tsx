'use client';

import * as React from 'react';
import Divider from '@mui/material/Divider';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SignOut as SignOutIcon } from '@phosphor-icons/react/dist/ssr/SignOut';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { useRouter } from 'next/navigation';
import type { User } from '@/types/user';

export interface UserPopoverProps {
  anchorEl: Element | null;
  onClose: () => void;
  open: boolean;
  user: User | null;
  onSignOut: () => Promise<void>;
}

export function UserPopover({ anchorEl, onClose, open, user, onSignOut }: UserPopoverProps): React.JSX.Element {
  const router = useRouter();

  const handleProfileClick = () => {
    if (!user?.id) return;
    onClose();
    router.push(`/dashboard/user/${user.id}/view`);
  };

  return (
    <Popover
      anchorEl={anchorEl}
      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      onClose={onClose}
      open={open}
      slotProps={{ paper: { sx: { width: '240px' } } }}
      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
    >
      <Stack spacing={2} sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Stack spacing={1}>
            <Typography variant="subtitle2">{user?.firstName} {user?.lastName}</Typography>
            <Typography color="text.secondary" variant="body2">
              {user?.email}
            </Typography>
          </Stack>
        </Stack>
        <Divider />
        <MenuList disablePadding>
          <MenuItem onClick={handleProfileClick}>
            <UserIcon />
            <Typography sx={{ ml: 1 }}>Profile</Typography>
          </MenuItem>
          <MenuItem
            onClick={async () => {
              onClose();
              await onSignOut();
            }}
          >
            <SignOutIcon />
            <Typography sx={{ ml: 1 }}>Sign out</Typography>
          </MenuItem>
        </MenuList>
      </Stack>
    </Popover>
  );
}
