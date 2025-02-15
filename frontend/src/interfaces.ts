interface Member {
  uid: number;
  last_name: string;
  first_name: string;
  email: string;
  position: string;
  phone_number: string;
  occupation: string;
  paid: boolean;
}

interface User {
  uid: string;
  email: string;
  first_name: string;
  last_name: string;
  position?: string;
  phone_number?: string;
  occupation?: string;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  paid: boolean;
  last_login?: string;
  date_joined?: string;
}

export type { Member, User };
