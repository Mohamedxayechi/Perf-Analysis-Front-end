export const claimReq = {
  adminOnly: (c: any) => c.roles.includes("Admin"),
  adminOrTeacher: (c: any) => c.roles.includes("Admin") || c.roles.includes("Teacher"),
  hasLibraryId: (c: any) => 'libraryID' in c,
  superAdmin: (c: any) => c.roles.includes("SuperAdmin"),
  user: (c: any) => c.roles.includes("User"),
  adminOrTeacherOrStudent: (c: any) => c.roles.includes("Admin") || c.roles.includes("Teacher")|| c.roles.includes("Student"),
};