import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, Circle, Trash2, Edit, Save, X } from "lucide-react";


interface Task {
  id: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface WhiteboardProps {
}

export default function Whiteboard({ }: WhiteboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user]);

  const fetchTasks = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("tasks" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTasks((data as unknown as Task[]) || []);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast({
        title: "Erro ao carregar tarefas",
        description: "Não foi possível carregar suas tarefas",
        variant: "destructive"
      });
    }
  };

  const addTask = async () => {
    if (!user || !newTask.trim()) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tasks" as any)
        .insert({
          user_id: user.id,
          description: newTask.trim(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      setTasks(prev => [data as unknown as Task, ...prev]);
      setNewTask("");

      toast({
        title: "Tarefa adicionada!",
        description: "Sua tarefa foi adicionada ao quadro"
      });
    } catch (error) {
      console.error("Error adding task:", error);
      toast({
        title: "Erro ao adicionar",
        description: "Não foi possível adicionar a tarefa",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("tasks" as any)
        .update({ status })
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (error) throw error;

      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, status } : task
      ));
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a tarefa",
        variant: "destructive"
      });
    }
  };

  const updateTaskDescription = async (taskId: string) => {
    if (!user || !editDescription.trim()) return;

    try {
      const { error } = await supabase
        .from("tasks" as any)
        .update({ description: editDescription.trim() })
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (error) throw error;

      setTasks(prev => prev.map(task =>
        task.id === taskId ? { ...task, description: editDescription.trim() } : task
      ));

      setEditingTask(null);
      setEditDescription("");

      toast({
        title: "Tarefa atualizada!",
        description: "A descrição foi atualizada"
      });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a tarefa",
        variant: "destructive"
      });
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("tasks" as any)
        .delete()
        .eq("id", taskId)
        .eq("user_id", user.id);

      if (error) throw error;

      setTasks(prev => prev.filter(task => task.id !== taskId));

      toast({
        title: "Tarefa removida",
        description: "A tarefa foi removida do quadro"
      });
    } catch (error) {
      console.error("Error deleting task:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a tarefa",
        variant: "destructive"
      });
    }
  };

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditDescription(task.description);
  };

  const cancelEditing = () => {
    setEditingTask(null);
    setEditDescription("");
  };

  const getStatusIcon = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'in_progress':
        return <Circle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: Task['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Concluída</Badge>;
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800">Em Progresso</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pendente</Badge>;
    }
  };



  return (
    <div className="p-5 h-full overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
          <span className="text-2xl"></span> Quadro de Tarefas
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Organize suas tarefas e acompanhe seu progresso empreendedor
        </p>
      </div>

      {/* Add Task */}
      <div className="glass-card rounded-xl p-4 mb-5">
        <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
          <Plus className="h-3.5 w-3.5" /> Adicionar Tarefa
        </p>
        <div className="flex gap-2">
          <Input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Descreva sua tarefa..."
            className="glass-input flex-1 h-9 rounded-lg text-sm"
            onKeyPress={(e) => e.key === 'Enter' && addTask()}
          />
          <Button
            onClick={addTask}
            disabled={!newTask.trim() || loading}
            size="sm"
            className="btn-gradient border-0 rounded-lg h-9 px-3 text-xs font-semibold"
          >
            {loading ? "..." : "Adicionar"}
          </Button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        {tasks.length === 0 ? (
          <div className="glass-card rounded-xl p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhuma tarefa ainda. Adicione sua primeira acima! ✨
            </p>
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className="glass-card rounded-xl p-3.5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-start gap-2.5">
                <button
                  onClick={() => updateTaskStatus(task.id,
                    task.status === 'completed' ? 'pending' : 'completed'
                  )}
                  className="mt-0.5 flex-shrink-0"
                >
                  {getStatusIcon(task.status)}
                </button>

                <div className="flex-1 min-w-0">
                  {editingTask === task.id ? (
                    <div className="space-y-2">
                      <Textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="glass-input min-h-[60px] rounded-lg text-xs"
                      />
                      <div className="flex gap-1.5">
                        <Button size="sm" onClick={() => updateTaskDescription(task.id)} disabled={!editDescription.trim()} className="h-7 text-xs btn-gradient border-0 rounded-lg">
                          <Save className="h-3 w-3 mr-1" /> Salvar
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEditing} className="h-7 text-xs glass-card border-0 rounded-lg">
                          <X className="h-3 w-3 mr-1" /> Cancelar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className={`text-sm ${task.status === 'completed' ? 'line-through text-muted-foreground/60' : 'text-foreground'}`}>
                        {task.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {getStatusBadge(task.status)}
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(task.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {editingTask !== task.id && (
                  <div className="flex gap-0.5 flex-shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => startEditing(task)} className="h-7 w-7 p-0 rounded-lg hover:bg-primary/10">
                      <Edit className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteTask(task.id)} className="h-7 w-7 p-0 rounded-lg hover:bg-red-50">
                      <Trash2 className="h-3.5 w-3.5 text-red-400" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}