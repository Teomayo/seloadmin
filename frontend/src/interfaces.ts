interface Member {
  uid: number;
  last_name: string;
  first_name: string;
  email: string;
  position: string;
  phone_number: string;
  occupation: string;
  paid: boolean;
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
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

interface Contact {
  id: string;
  full_name: string;
  email: string;
  phone_number: string;
  website: string;
  is_sponsor: boolean;
  is_vendor: boolean;
}

interface Question {
  id: string;
  text: string;
  choices: Array<{
    text: string;
    votes: number;
  }>;
  created_at: Date;
  voted_users: string[];
  is_archived?: boolean;
}

interface UserPreferences {
  theme: string;
  widget_settings: {
    orthodox: boolean;
    questions: boolean;
    members: boolean;
  };
}

export type { Member, User, Contact, Question, UserPreferences };
