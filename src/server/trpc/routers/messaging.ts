import { createTRPCRouter } from "~/server/trpc/main";
import { sendMessage } from "../procedures/messaging/sendMessage";
import { getMessages } from "../procedures/messaging/getMessages";
import { getCalls } from "../procedures/messaging/getCalls";
import { markMessageRead } from "../procedures/messaging/markMessageRead";
import { getUnreadCount } from "../procedures/messaging/getUnreadCount";
import { syncMessages } from "../procedures/messaging/syncMessages";
import { syncCalls } from "../procedures/messaging/syncCalls";
import { deleteConversation } from "../procedures/messaging/deleteConversation";
import { renameContact } from "../procedures/messaging/renameContact";
import { markConversationRead } from "../procedures/messaging/markConversationRead";

export const messagingRouter = createTRPCRouter({
  sendMessage,
  getMessages,
  getCalls,
  markMessageRead,
  getUnreadCount,
  syncMessages,
  syncCalls,
  deleteConversation,
  renameContact,
  markConversationRead,
});
