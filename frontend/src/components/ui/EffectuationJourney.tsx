import { motion } from "framer-motion";
import { CheckCircle, Circle } from "lucide-react";
import { Card } from "@/components/ui/card";

interface JourneyProps {
  data: {
    what_you_know: string;
    what_you_want: string;
    who_you_know: string;
    what_you_invest: string;
  };
}

export function EffectuationJourney({ data }: JourneyProps) {
  const steps = [
    { title: "O que você sabe", done: !!data.what_you_know },
    { title: "O que você quer", done: !!data.what_you_want },
    { title: "Quem você conhece", done: !!data.who_you_know },
    { title: "O que você investe", done: !!data.what_you_invest },
    { title: "Dê o primeiro passo", done: false },
  ];

  const progress = (steps.filter(s => s.done).length / steps.length) * 100;

  return (
    <div className="space-y-4">
      <div className="relative w-full h-3 bg-secondary/30 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1 }}
        />
      </div>

      <div className="grid md:grid-cols-5 gap-3">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.2 }}
          >
            <Card className="flex items-center gap-3 p-4 cursor-pointer hover:scale-105 transition-all">
              {step.done ? (
                <CheckCircle className="text-green-500" />
              ) : (
                <Circle className="text-gray-500" />
              )}
              <span className="text-sm font-medium">{step.title}</span>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
