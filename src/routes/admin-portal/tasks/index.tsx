
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { AdminShell } from "~/components/admin/AdminShell";
import { CheckCircle, Plus, Trash2, X } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";

export const Route = createFileRoute("/admin-portal/tasks/")({
    component: TasksPage,
});

const taskSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
});

type TaskFormValues = z.infer<typeof taskSchema>;

function TasksPage() {
    const trpc = useTRPC();
    // const utils = trpc.useUtils(); // Removed
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isAddingTask, setIsAddingTask] = useState(false);

    const tasksQuery = useQuery(
        trpc.tasks.getDailyTasks.queryOptions({
            date: selectedDate,
        })
    );

    const createTaskMutation = useMutation(
        trpc.tasks.createTask.mutationOptions({
            onSuccess: () => {
                tasksQuery.refetch();
                setIsAddingTask(false);
                toast.success("Task created");
            },
        })
    );

    const updateTaskMutation = useMutation(
        trpc.tasks.updateTask.mutationOptions({
            onSuccess: () => {
                tasksQuery.refetch();
            },
        })
    );

    const deleteTaskMutation = useMutation(
        trpc.tasks.deleteTask.mutationOptions({
            onSuccess: () => {
                tasksQuery.refetch();
                toast.success("Task deleted");
            },
        })
    );

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<TaskFormValues>({
        resolver: zodResolver(taskSchema),
        defaultValues: {
            priority: "MEDIUM",
        },
    });

    const onSubmit = (data: TaskFormValues) => {
        createTaskMutation.mutate({
            ...data,
            date: selectedDate,
        });
        reset();
    };

    const toggleTaskStatus = (task: any) => {
        const newStatus = task.status === "COMPLETED" ? "PENDING" : "COMPLETED";
        updateTaskMutation.mutate({
            id: task.id,
            status: newStatus,
        });
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Are you sure you want to delete this task?")) {
            deleteTaskMutation.mutate({ id });
        }
    };

    const formattedDate = new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(selectedDate);

    const changeDate = (days: number) => {
        const newDate = new Date(selectedDate);
        newDate.setDate(selectedDate.getDate() + days);
        setSelectedDate(newDate);
    };

    return (
        <AdminShell title="Daily Tasks" subtitle="Manage your manual to-do list">
            <div className="flex gap-6 flex-col lg:flex-row">
                {/* Sidebar / Calendar Control */}
                <div className="w-full lg:w-80 shrink-0">
                    <div className="rounded-3xl border border-white/40 bg-white/60 p-6 shadow-sm backdrop-blur-md sticky top-6">
                        <h3 className="text-lg font-bold text-[#0f172a] mb-4">Select Date</h3>
                        <div className="flex items-center justify-between mb-4">
                            <button
                                onClick={() => changeDate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                            >
                                ←
                            </button>
                            <span className="font-semibold text-gray-700">
                                {selectedDate.toLocaleDateString()}
                            </span>
                            <button
                                onClick={() => changeDate(1)}
                                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
                            >
                                →
                            </button>
                        </div>

                        <button
                            onClick={() => setSelectedDate(new Date())}
                            className="w-full py-2 bg-[#163022] text-white rounded-xl font-bold text-sm hover:bg-[#10271b] transition-colors"
                        >
                            Today
                        </button>
                    </div>
                </div>

                {/* Main Task List */}
                <div className="flex-1">
                    <div className="rounded-3xl border border-white/40 bg-white/60 p-6 shadow-sm backdrop-blur-md min-h-[500px]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-[#0f172a]">{formattedDate}</h2>
                                <p className="text-gray-500 text-sm">
                                    {tasksQuery.data?.length ?? 0} tasks for this day
                                </p>
                            </div>
                            <button
                                onClick={() => setIsAddingTask(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-colors"
                            >
                                <Plus className="w-4 h-4" /> Add Task
                            </button>
                        </div>

                        {/* Add Task Form */}
                        {isAddingTask && (
                            <div className="mb-6 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-2">
                                <div className="flex justify-between items-start mb-4">
                                    <h3 className="font-bold text-gray-800">New Task</h3>
                                    <button onClick={() => setIsAddingTask(false)} className="text-gray-400 hover:text-gray-600">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Title</label>
                                        <input
                                            {...register("title")}
                                            className="w-full rounded-xl border-gray-200 focus:border-[#163022] focus:ring-[#163022]"
                                            placeholder="e.g. Call vendor regarding supplies"
                                        />
                                        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Description</label>
                                        <textarea
                                            {...register("description")}
                                            rows={2}
                                            className="w-full rounded-xl border-gray-200 focus:border-[#163022] focus:ring-[#163022]"
                                            placeholder="Optional details..."
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Priority</label>
                                            <select
                                                {...register("priority")}
                                                className="w-full rounded-xl border-gray-200 focus:border-[#163022] focus:ring-[#163022]"
                                            >
                                                <option value="LOW">Low</option>
                                                <option value="MEDIUM">Medium</option>
                                                <option value="HIGH">High</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="submit"
                                            disabled={createTaskMutation.isPending}
                                            className="px-6 py-2 bg-[#163022] text-white rounded-xl font-bold hover:bg-[#10271b] disabled:opacity-50"
                                        >
                                            {createTaskMutation.isPending ? "Saving..." : "Create Task"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Task List */}
                        <div className="space-y-3">
                            {tasksQuery.isLoading ? (
                                <div className="text-center py-12 text-gray-400">Loading tasks...</div>
                            ) : tasksQuery.data?.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <CheckCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">No tasks yet</h3>
                                    <p className="text-gray-400 text-sm">Enjoy your day or add a new task above.</p>
                                </div>
                            ) : (
                                tasksQuery.data?.map((task) => (
                                    <div
                                        key={task.id}
                                        className={`group relative flex items-start gap-4 p-4 rounded-2xl border transition-all ${task.status === "COMPLETED"
                                            ? "bg-gray-50 border-gray-100 opacity-75"
                                            : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-md"
                                            }`}
                                    >
                                        <button
                                            onClick={() => toggleTaskStatus(task)}
                                            className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${task.status === "COMPLETED"
                                                ? "bg-emerald-500 border-emerald-500 text-white"
                                                : "border-gray-300 hover:border-emerald-500 text-transparent"
                                                }`}
                                        >
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        </button>

                                        <div className="flex-1 min-w-0">
                                            <h4 className={`text-sm font-bold ${task.status === "COMPLETED" ? "text-gray-500 line-through" : "text-[#0f172a]"}`}>
                                                {task.title}
                                            </h4>
                                            {task.description && (
                                                <p className={`text-xs mt-1 ${task.status === "COMPLETED" ? "text-gray-400" : "text-gray-500"}`}>
                                                    {task.description}
                                                </p>
                                            )}
                                            <div className="flex gap-2 mt-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${task.priority === 'HIGH' ? 'bg-rose-50 text-rose-700' :
                                                    task.priority === 'MEDIUM' ? 'bg-amber-50 text-amber-700' :
                                                        'bg-blue-50 text-blue-700'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => handleDelete(task.id)}
                                            className="p-2 text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
