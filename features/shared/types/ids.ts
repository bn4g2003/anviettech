export type EntityId = string;

export type Timestamps = {
  createdAt: string;
  updatedAt: string;
};

export type OwnerRef = {
  id: EntityId;
  name: string;
  avatarUrl?: string;
};
