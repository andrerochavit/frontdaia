import { useState, useCallback, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  NodeChange,
  EdgeChange,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Download, Plus, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { createLLMService, defaultLLMConfig } from "@/services/llmService";

interface AIMindMapProps {
  onClose?: () => void;
}

const colors = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7",
  "#DDA15E", "#BC6C25", "#8E44AD", "#3498DB", "#E74C3C"
];

export function AIMindMap({ onClose }: AIMindMapProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [centralTopic, setCentralTopic] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const generateInitialMap = async () => {
    if (!centralTopic.trim() || !user) return;

    setIsGenerating(true);
    try {
      // Create session
      const { data: session, error: sessionError } = await (supabase as any)
        .from("mind_map_sessions")
        .insert({
          user_id: user.id,
          title: centralTopic,
          central_topic: centralTopic,
        })
        .select()
        .single();

      if (sessionError) throw sessionError;
      setSessionId(session.id);

      // Generate AI suggestions for branches
      const llmService = createLLMService(defaultLLMConfig);
      const response = await llmService.generateResponse(
        `Gere 5 ramos principais para um mapa mental sobre: "${centralTopic}". Retorne apenas uma lista com os tópicos, um por linha, sem numeração ou símbolos.`,
        null,
        { what_you_know: "", what_you_want: "", who_you_know: "", what_you_invest: "" },
        []
      );

      const branches = response.content
        .split("\n")
        .filter((line) => line.trim())
        .slice(0, 5);

      // Create central node
      const centralNode: Node = {
        id: "central",
        type: "default",
        data: { label: centralTopic },
        position: { x: 400, y: 250 },
        style: {
          background: "#8B5CF6",
          color: "white",
          border: "3px solid #6D28D9",
          borderRadius: "50%",
          width: 180,
          height: 180,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: "bold",
          textAlign: "center",
          padding: "20px",
        },
      };

      // Create branch nodes in a circle around the central node
      const branchNodes: Node[] = branches.map((branch, index) => {
        const angle = (index * 2 * Math.PI) / branches.length;
        const radius = 300;
        const x = 400 + radius * Math.cos(angle);
        const y = 250 + radius * Math.sin(angle);

        return {
          id: `branch-${index}`,
          type: "default",
          data: { label: branch.trim() },
          position: { x, y },
          style: {
            background: colors[index % colors.length],
            color: "white",
            border: "2px solid rgba(255,255,255,0.5)",
            borderRadius: "12px",
            padding: "15px",
            fontSize: "14px",
            fontWeight: "500",
            minWidth: "140px",
            textAlign: "center",
          },
        };
      });

      // Create edges connecting branches to central node
      const branchEdges: Edge[] = branches.map((_, index) => ({
        id: `edge-central-${index}`,
        source: "central",
        target: `branch-${index}`,
        type: "smoothstep",
        animated: true,
        style: { stroke: colors[index % colors.length], strokeWidth: 2 },
      }));

      setNodes([centralNode, ...branchNodes]);
      setEdges(branchEdges);

      // Save to database
      await (supabase as any).from("mind_map_items").insert([
        {
          user_id: user.id,
          session_id: session.id,
          node_id: "central",
          label: centralTopic,
          type: "central",
          position_x: 400,
          position_y: 250,
          color: "#8B5CF6",
        },
        ...branchNodes.map((node, index) => ({
          user_id: user.id,
          session_id: session.id,
          node_id: node.id,
          label: branches[index],
          type: "branch",
          parent_id: "central",
          position_x: node.position.x,
          position_y: node.position.y,
          color: colors[index % colors.length],
        })),
      ]);

      toast({
        title: "Mapa mental gerado! ✨",
        description: "Clique nos nós para expandir ou editar",
      });
    } catch (error) {
      console.error("Error generating mind map:", error);
      toast({
        title: "Erro ao gerar mapa",
        description: "Tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNodeClick = useCallback(
    async (event: React.MouseEvent, node: Node) => {
      setSelectedNode(node);
      setShowSuggestions(true);

      // Generate AI suggestions
      try {
        const llmService = createLLMService(defaultLLMConfig);
        const response = await llmService.generateResponse(
          `Para o tópico "${node.data.label}", sugira 3 ações curtas: 1) expandir ideia, 2) adicionar conceito relacionado, 3) resumir. Retorne apenas as 3 sugestões, uma por linha.`,
          null,
          { what_you_know: "", what_you_want: "", who_you_know: "", what_you_invest: "" },
          []
        );

        const suggestions = response.content
          .split("\n")
          .filter((line) => line.trim())
          .slice(0, 3);
        setAiSuggestions(suggestions);
      } catch (error) {
        console.error("Error generating suggestions:", error);
      }
    },
    []
  );

  const addChildNode = async (parentNode: Node, label: string) => {
    if (!user || !sessionId) return;

    const newId = `node-${Date.now()}`;
    const parentChildren = nodes.filter(
      (n) => edges.some((e) => e.source === parentNode.id && e.target === n.id)
    );
    const childIndex = parentChildren.length;
    const angle = (childIndex * Math.PI) / 3;
    const radius = 150;
    
    const newNode: Node = {
      id: newId,
      type: "default",
      data: { label },
      position: {
        x: parentNode.position.x + radius * Math.cos(angle),
        y: parentNode.position.y + radius * Math.sin(angle),
      },
      style: {
        background: colors[(childIndex + 2) % colors.length],
        color: "white",
        border: "2px solid rgba(255,255,255,0.5)",
        borderRadius: "10px",
        padding: "12px",
        fontSize: "13px",
        minWidth: "120px",
        textAlign: "center",
      },
    };

    const newEdge: Edge = {
      id: `edge-${parentNode.id}-${newId}`,
      source: parentNode.id,
      target: newId,
      type: "smoothstep",
      style: { stroke: colors[(childIndex + 2) % colors.length], strokeWidth: 2 },
    };

    setNodes((nds) => [...nds, newNode]);
    setEdges((eds) => [...eds, newEdge]);

    // Save to database
    await (supabase as any).from("mind_map_items").insert({
      user_id: user.id,
      session_id: sessionId,
      node_id: newId,
      label,
      type: "subtopic",
      parent_id: parentNode.id,
      position_x: newNode.position.x,
      position_y: newNode.position.y,
      color: colors[(childIndex + 2) % colors.length],
    });
  };

  const exportAsPDF = async () => {
    const element = document.querySelector(".react-flow") as HTMLElement;
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`mapa-mental-${centralTopic || "ideias"}.pdf`);

      toast({
        title: "PDF exportado! 📄",
        description: "Seu mapa mental foi salvo",
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Erro ao exportar",
        variant: "destructive",
      });
    }
  };

  const exportAsImage = async () => {
    const element = document.querySelector(".react-flow") as HTMLElement;
    if (!element) return;

    try {
      const canvas = await html2canvas(element);
      const link = document.createElement("a");
      link.download = `mapa-mental-${centralTopic || "ideias"}.png`;
      link.href = canvas.toDataURL();
      link.click();

      toast({
        title: "Imagem exportada! 🖼️",
        description: "Seu mapa mental foi salvo",
      });
    } catch (error) {
      console.error("Error exporting image:", error);
      toast({
        title: "Erro ao exportar",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4 bg-card">
        <div className="flex items-center justify-between">
          <div className="flex-1 max-w-xl">
            {!sessionId ? (
              <div className="flex gap-2">
                <Input
                  value={centralTopic}
                  onChange={(e) => setCentralTopic(e.target.value)}
                  placeholder="Digite o tópico central do seu mapa mental..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === "Enter" && generateInitialMap()}
                />
                <Button
                  onClick={generateInitialMap}
                  disabled={!centralTopic.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Gerar Mapa
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <h2 className="text-xl font-bold text-foreground">{centralTopic}</h2>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={exportAsImage} disabled={!sessionId}>
              <Download className="h-4 w-4 mr-2" />
              Imagem
            </Button>
            <Button variant="outline" onClick={exportAsPDF} disabled={!sessionId}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </div>

      {/* Mind Map Canvas */}
      <div className="flex-1 relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          fitView
          className="bg-gradient-to-br from-background to-muted"
        >
          <Background />
          <Controls />
          <MiniMap />

          {/* AI Suggestions Panel */}
          {showSuggestions && selectedNode && (
            <Panel position="top-right" className="m-4">
              <Card className="p-4 w-80 bg-card/95 backdrop-blur">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-sm">Sugestões IA</span>
                </div>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-left text-xs"
                      onClick={() => {
                        addChildNode(selectedNode, suggestion);
                        setShowSuggestions(false);
                      }}
                    >
                      <Plus className="h-3 w-3 mr-2" />
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
}
