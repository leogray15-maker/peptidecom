import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { safe } from "@/lib/safe-db";
import { TasksPanel, type TaskItem } from "@/components/admin/tasks-panel";

export const metadata = { title: "Tasks" };

export default async function AdminTasksPage() {
  const rows = await safe(
    () =>
      prisma.crmTask.findMany({
        orderBy: [{ status: "asc" }, { dueAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
        take: 200,
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
    []
  );

  const tasks: TaskItem[] = rows.map((t) => ({
    id: t.id,
    title: t.title,
    details: t.details,
    status: t.status,
    priority: t.priority,
    dueAt: t.dueAt?.toISOString() ?? null,
    user: t.user,
  }));

  const open = tasks.filter((t) => t.status === "OPEN").length;

  return (
    <div>
      <PageHeader
        title="Tasks"
        subtitle={`${open} open follow-up${open === 1 ? "" : "s"}. Link tasks to a customer from their profile.`}
      />
      <TasksPanel tasks={tasks} showCustomer title="All tasks" />
    </div>
  );
}
