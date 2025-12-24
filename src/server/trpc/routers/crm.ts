import { createTRPCRouter } from "~/server/trpc/main";
import { createLead } from "../procedures/crm/createLead";
import { getLeads } from "../procedures/crm/getLeads";
import { updateLead } from "../procedures/crm/updateLead";
import { deleteLead } from "../procedures/crm/deleteLead";
import { analyzeCallTranscript } from "../procedures/ai/analyzeCallTranscript";
import { convertLeadToBooking } from "../procedures/crm/convertLeadToBooking";

import { getLeadSources } from "../procedures/crm/getLeadSources";
import { createLeadSource } from "../procedures/crm/createLeadSource";
import { deleteLeadSource } from "../procedures/crm/deleteLeadSource";

export const crmRouter = createTRPCRouter({
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  analyzeCallTranscript,
  convertLeadToBooking,
  getLeadSources,
  createLeadSource,
  deleteLeadSource,
});
