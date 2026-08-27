export const WORKFLOW = [
  {
    id: "backlog",
    title: "Backlog",
    description: "Ideas waiting for a decision",
    tone: "slate",
  },
  {
    id: "todo",
    title: "To do",
    description: "Ready to be picked up",
    tone: "blue",
  },
  {
    id: "in-progress",
    title: "In progress",
    description: "Work moving right now",
    tone: "amber",
  },
  {
    id: "review",
    title: "Review",
    description: "Waiting for a second look",
    tone: "violet",
  },
  {
    id: "done",
    title: "Done",
    description: "Finished and shipped",
    tone: "green",
  },
];

export const PRIORITIES = [
  { id: "low", title: "Low" },
  { id: "medium", title: "Medium" },
  { id: "high", title: "High" },
  { id: "urgent", title: "Urgent" },
];

export const createEmptyGroups = () =>
  Object.fromEntries(WORKFLOW.map((column) => [column.id, []]));

export const groupIssues = (issues = []) => {
  const groups = createEmptyGroups();

  issues.forEach((issue) => {
    const status = groups[issue.status] ? issue.status : "todo";
    groups[status].push({ ...issue, status });
  });

  Object.values(groups).forEach((items) => {
    items.sort((first, second) => (first.position ?? 0) - (second.position ?? 0));
  });

  return groups;
};

export const flattenGroups = (groups) =>
  WORKFLOW.flatMap((column) =>
    (groups[column.id] || []).map((issue, position) => ({
      ...issue,
      status: column.id,
      position,
    })),
  );

export const serializeGroups = (groups) =>
  WORKFLOW.map((column) => ({
    status: column.id,
    issueIds: (groups[column.id] || []).map((issue) => issue._id),
  }));
