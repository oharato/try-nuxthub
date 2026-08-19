declare module "#auth-utils" {
  interface User {
    id: number;
    name: string;
    email: string;
    role: string;
    loggedInAt: string;
  }

  interface UserSession {
    user?: User;
    loggedInAt?: string;
  }
}

export {};
