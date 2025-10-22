export type Role = 'admin' | 'manager' | 'editor' | 'viewer' | 'user' | 'guest';

const hierarchy: Record<Role, number> = {
  guest: 0,
  user: 1,
  viewer: 2,
  editor: 3,
  manager: 4,
  admin: 5
};

export function hasAccess(userRole: Role | null, minRole: Role) {
  if (!userRole) return false;
  return hierarchy[userRole] >= hierarchy[minRole];
}
