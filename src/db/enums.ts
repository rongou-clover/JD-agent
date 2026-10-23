export const MESSAGE_ROLES = ["user", "agent"] as const;
export type MessageRole = (typeof MESSAGE_ROLES)[number];
