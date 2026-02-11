export type LeadFilters = {
  dateRange: any | null;
  counterparty: any | null;
  inn: string;
  name: string;
  type: string;
  status: string;
  moderator: string;
  leadId: string;
};

export const getDefaultLeadFilters = (): LeadFilters => ({
  dateRange: null,
  counterparty: null,
  inn: "",
  name: "",
  type: "",
  status: "",
  moderator: "",
  leadId: "",
});

const normalizeString = (str?: string | null) => (str ?? "").toLowerCase();

export const filterLeads = (leads: any[], filters: LeadFilters) => {
  const { dateRange, counterparty, inn, name, type, status, moderator, leadId } = filters;
  const normalizedInn = inn.trim().toLowerCase();
  const normalizedName = name.trim().toLowerCase();
  const normalizedType = type.trim().toLowerCase();
  const normalizedModerator = moderator.trim().toLowerCase();
  const numericLeadId = leadId.trim() ? Number(leadId) : null;

  return (leads || []).filter((lead: any) => {
    let matchesCreationDate = true;
    if (dateRange && (dateRange.start || dateRange.end)) {
      const leadDate = new Date(lead?.createdAt || lead?.updatedAt || lead?.date || 0);

      if (dateRange.start) {
        const startDate = new Date(dateRange.start.toString());
        startDate.setHours(0, 0, 0, 0);
        matchesCreationDate = matchesCreationDate && leadDate >= startDate;
      }

      if (dateRange.end) {
        const endDate = new Date(dateRange.end.toString());
        endDate.setHours(23, 59, 59, 999);
        matchesCreationDate = matchesCreationDate && leadDate <= endDate;
      }
    }

    let matchesCounterparty = true;
    if (counterparty && counterparty.value) {
      matchesCounterparty = lead?.counterpartyId === counterparty.value;
    }

    let matchesInn = true;
    if (normalizedInn) {
      const leadInn = normalizeString(
        lead?.organization?.inn || lead?.counterparty?.organization_INN || lead?.counterparty?.organization_inn
      );
      matchesInn = leadInn.includes(normalizedInn);
    }

    let matchesName = true;
    if (normalizedName) {
      const leadName = normalizeString(lead?.name);
      matchesName = leadName.includes(normalizedName);
    }

    let matchesType = true;
    if (normalizedType) {
      const leadType = normalizeString(lead?.type);
      matchesType = leadType.includes(normalizedType);
    }

    let matchesStatus = true;
    if (status) {
      matchesStatus = lead?.status === status;
    }

    let matchesModerator = true;
    if (normalizedModerator) {
      const moderatorFullName = [lead?.moderators?.surname, lead?.moderators?.name, lead?.moderators?.patronymic]
        .filter(Boolean)
        .join(" ");
      const moderatorSearchTarget = `${moderatorFullName} ${lead?.moderators?.email ?? ""}`.toLowerCase();
      matchesModerator = moderatorSearchTarget.includes(normalizedModerator);
    }

    let matchesLeadId = true;
    if (numericLeadId !== null && !Number.isNaN(numericLeadId)) {
      matchesLeadId = lead?.id === numericLeadId;
    }

    return (
      matchesCreationDate &&
      matchesCounterparty &&
      matchesInn &&
      matchesName &&
      matchesType &&
      matchesStatus &&
      matchesModerator &&
      matchesLeadId
    );
  });
};
