import { createTRPCRouter } from "~/server/trpc/main";
import { punchIn } from "../procedures/time/punchIn";
import { punchOut } from "../procedures/time/punchOut";
import { getTimeEntries } from "../procedures/time/getTimeEntries";
import { updateTimeEntry } from "../procedures/time/updateTimeEntry";
import { deleteTimeEntry } from "../procedures/time/deleteTimeEntry";

export const timeRouter = createTRPCRouter({
  punchIn,
  punchOut,
  getTimeEntries,
  updateTimeEntry,
  deleteTimeEntry,
});
