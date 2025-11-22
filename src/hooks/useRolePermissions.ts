// src/hooks/useRolePermissions.ts
'use client';

import { useMemo } from 'react';
import { useUserRole } from './useUserRole';
import {
  getPermissionsForRole,
  type RoleWithPermissions
} from '@/lib/permissions';

export function useRolePermissions() {
  const { role, loading } = useUserRole();

  const permissions: RoleWithPermissions = useMemo(
    () => getPermissionsForRole(role),
    [role]
  );

  return {
    role: permissions.role,
    permissions,
    loading
  };
}
