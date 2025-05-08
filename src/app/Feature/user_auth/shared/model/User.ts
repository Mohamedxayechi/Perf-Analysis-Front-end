export interface IdentityError {
    code: string;
    description: string;
  }
  
  export interface IdentityResult {
    succeeded: boolean;
    errors: IdentityError[];
  }