interface UserContext {
  roles: string[];
}

export const claimReq = {
  adminOnly: (c: UserContext) => c.roles.includes("Admin"),
  superAdmin: (c: UserContext) => c.roles.includes("SuperAdmin"),
  user: (c: UserContext) => c.roles.includes("User"),
};