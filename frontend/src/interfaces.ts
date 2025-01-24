interface Member {
  id: number;
  last_name: string;
  first_name: string;
  email: string;
  position: string;
  phone_number: string;
  occupation: string;
  paid: boolean;
}

interface User {
  ID: number;
  Username: string;
  Email: string;
  Password: string;
  FirstName: string;
  LastName: string;
  Position: string;
  PhoneNumber: string;
  Occupation: string;
  IsActive: boolean;
  IsStaff: boolean;
  IsSuperUser: boolean;
  Paid: boolean;
  LastLogin: string;
  DateJoined: string;
}

export type { Member, User };
