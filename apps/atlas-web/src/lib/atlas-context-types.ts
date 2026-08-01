export interface AtlasContextValue {
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  };
  account: {
    id: string;
    name: string;
    email: string;
    avatarUrl: string | null;
    createdAt: string;
  };
  workspace: {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
  };
  membership: {
    role: "owner" | "admin" | "member";
    createdAt: string;
  };
}
