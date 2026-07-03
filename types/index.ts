// Shared TypeScript types across the application

export interface Post {
  id: string;
  content: string | null;
  mediaUrl: string | null;
  mediaType: string | null;
  linkUrl: string | null;
  flagged: boolean;
  createdAt: string;
  authorId: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatarUrl: string | null;
    isOnline: boolean;
  };
  _count?: {
    likes: number;
    comments: number;
  };
  isLiked?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  role: 'MEMBER' | 'ADMIN';
  isOnline: boolean;
  lastSeen: string;
  publicKey: string;
  createdAt: string;
}

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: 'PENDING' | 'ACCEPTED' | 'BLOCKED';
  createdAt: string;
}

export interface Message {
  id: string;
  ciphertext: string;
  nonce: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

export interface Group {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  createdById: string;
  createdAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: 'MEMBER' | 'MODERATOR';
}

export interface Report {
  id: string;
  type: 'REPORT' | 'SUGGESTION';
  content: string;
  anonymous: boolean;
  authorId: string | null;
  createdAt: string;
  author?: { id: string; name: string; username: string } | null;
}
