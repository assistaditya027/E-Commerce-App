export const buildStatusEntry = (status, by = 'system', at = new Date()) => ({
  status,
  by,
  at,
});

export const appendStatusHistory = (statusHistory = [], status, by = 'system', at = new Date()) => [
  ...statusHistory,
  buildStatusEntry(status, by, at),
];
