export type StoredUser = {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

export type PublicUser = Omit<StoredUser, "passwordHash">;
