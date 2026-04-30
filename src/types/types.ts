
export type TaskItem = {
  id?: string;
  name: string;
  description: string;
  dueDate: string;
  dueTime: string;
  isCompleted: boolean;
  isGoal?: boolean;
  createdAt?: Date;
};

export type User = {
  email: string;
  password: string;
  token?: string;
  task: TaskItem[];
  goal: any[];
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  duration: string;
  days: any[];
  createdAt: Date;
};
