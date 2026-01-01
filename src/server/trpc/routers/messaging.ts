import { createTRPCRouter } from "~/server/trpc/main";
import { sendMessage } from "../procedures/messaging/sendMessage";
import { getMessages } from "../procedures/messaging/getMessages";
import { getCalls } from "../procedures/messaging/getCalls";
import { markMessageRead } from "../procedures/messaging/markMessageRead";
import { getUnreadCount } from "../procedures/messaging/getUnreadCount";
import { syncMessages } from "../procedures/messaging/syncMessages";
import { syncCalls } from "../procedures/messaging/syncCalls";
import { syncAll } from "../procedures/messaging/syncAll";
import { deleteConversation } from "../procedures/messaging/deleteConversation";
import { renameContact } from "../procedures/messaging/renameContact";
import { markConversationRead } from "../procedures/messaging/markConversationRead";
import { updateContact } from "../procedures/messaging/updateContact";
import { togglePinContact } from "../procedures/messaging/togglePinContact";

export const messagingRouter = createTRPCRouter({
  sendMessage,
  getMessages,
  getCalls,
  markMessageRead,
  getUnreadCount,
  syncMessages,
  syncCalls,
  syncAll,
  deleteConversation,
  renameContact,
  updateContact,
  togglePinContact,
  markConversationRead,
});
