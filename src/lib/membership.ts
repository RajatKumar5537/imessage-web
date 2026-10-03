import Conversation from "@/lib/models/Conversation";

export async function userInConversation(conversationId: string, userId: string): Promise<boolean> {
  if (!conversationId || !userId) return false;
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  })
    .select("_id")
    .lean();
  return Boolean(conversation);
}
