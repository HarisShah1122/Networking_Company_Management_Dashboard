export const hasRole = (userRole, allowedRoles) => {
  if (!userRole || !allowedRoles) return false;
  return allowedRoles.includes(userRole);
};

export const isCEO = (userRole) => userRole === 'CEO';
export const isManager = (userRole) => userRole === 'Manager' || userRole === 'CEO';
export const isStaff = (userRole) => ['CEO', 'Manager', 'Staff'].includes(userRole);

export const canAccess = (userRole, requiredRole) => {
  const roleHierarchy = {
    CEO: 3,
    Manager: 2,
    Staff: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

