export type User = {
  id: string;
  username: string;
  avatarUrl?: string;
  streak?: number;
};

export type Post = {
  id: string;
  title: string;
  imageUrl: string;
  images?: string[];
  description?: string;
  category: string;
  tags?: string[];
  score: number;
  votes: number;
  favorites?: number;
  isFavorited?: boolean;
  trendingScore?: number;
  controversialScore?: number;
  userRating?: number;
  comments?: Array<{
    id: string;
    user: string;
    text: string;
  }>;
  user: User;
  createdAt?: string;
};

export type PostRater = {
  id: string;
  value: number;
  createdAt?: string;
  user: User;
};
