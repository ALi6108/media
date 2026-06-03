export interface User {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string;
  department?: string;
  joinDate?: string;
}

export interface TeamMember extends User {
  performanceHistory?: any[]; // will link to performance types later
}
