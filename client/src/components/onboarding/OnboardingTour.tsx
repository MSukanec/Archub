import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, ArrowRight, ArrowLeft, Star, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
  character: 'alex' | 'maya' | 'sam';
  characterMessage: string;
  action?: () => void;
}

interface OnboardingTourProps {
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const characters = {
  alex: {
    name: 'Alex',
    emoji: '👷‍♂️',
    color: 'from-blue-500 to-blue-600',
    personality: 'Experto en construcción con 15 años de experiencia'
  },
  maya: {
    name: 'Maya',
    emoji: '👩‍💼',
    color: 'from-purple-500 to-purple-600',
    personality: 'Gerente de proyectos y especialista en organización'
  },
  sam: {
    name: 'Sam',
    emoji: '💰',
    color: 'from-green-500 to-green-600',
    personality: 'Analista financiero y experto en presupuestos'
  }
};

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: '¡Bienvenido a Archub!',
    description: 'Te guiaremos a través de las funciones principales para que puedas empezar a gestionar tus proyectos de construcción.',
    target: 'body',
    position: 'center',
    character: 'alex',
    characterMessage: '¡Hola! Soy Alex, tu guía de construcción. Estoy aquí para mostrarte cómo Archub puede revolucionar la gestión de tus proyectos.'
  },
  {
    id: 'sidebar',
    title: 'Panel de Navegación',
    description: 'Desde aquí puedes acceder a todas las secciones: proyectos, finanzas, bitácora y más.',
    target: '[data-tour="sidebar"]',
    position: 'right',
    character: 'maya',
    characterMessage: 'Hola, soy Maya. Este panel lateral es tu centro de control. Cada icono te lleva a una sección especializada.'
  },
  {
    id: 'projects',
    title: 'Gestión de Proyectos',
    description: 'Crea, organiza y supervisa todos tus proyectos de construcción en un solo lugar.',
    target: '[data-tour="projects-nav"]',
    position: 'right',
    character: 'alex',
    characterMessage: 'Aquí es donde la magia sucede. Puedes crear proyectos, asignar tareas y seguir el progreso en tiempo real.'
  },
  {
    id: 'finances',
    title: 'Control Financiero',
    description: 'Mantén el control de presupuestos, gastos y flujo de caja de todos tus proyectos.',
    target: '[data-tour="finances-nav"]',
    position: 'right',
    character: 'sam',
    characterMessage: '¡Hola! Soy Sam, tu experto financiero. Te ayudo a mantener tus proyectos rentables y bajo control presupuestario.'
  },
  {
    id: 'site-logs',
    title: 'Bitácora de Obra',
    description: 'Registra el progreso diario, condiciones climáticas y eventos importantes de cada proyecto.',
    target: '[data-tour="site-logs-nav"]',
    position: 'right',
    character: 'alex',
    characterMessage: 'La bitácora es crucial. Documenta todo lo que pasa en obra para tener un historial completo.'
  },
  {
    id: 'profile',
    title: 'Tu Perfil Personal',
    description: 'Personaliza tu cuenta, gestiona preferencias y sube tu avatar personalizado.',
    target: '[data-tour="profile-button"]',
    position: 'left',
    character: 'maya',
    characterMessage: 'Tu perfil es tu espacio personal. Aquí puedes personalizar la experiencia según tus necesidades.'
  },
  {
    id: 'complete',
    title: '¡Listo para Empezar!',
    description: 'Ya conoces las funciones principales. ¡Es hora de crear tu primer proyecto y comenzar a gestionar con Archub!',
    target: 'body',
    position: 'center',
    character: 'alex',
    characterMessage: '¡Excelente! Ahora tienes todo lo necesario para gestionar tus proyectos como un profesional. ¡Construyamos algo increíble juntos!'
  }
];

export default function OnboardingTour({ isVisible, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightTarget, setHighlightTarget] = useState<HTMLElement | null>(null);

  const step = tourSteps[currentStep];
  const character = characters[step.character];
  const progress = ((currentStep + 1) / tourSteps.length) * 100;

  useEffect(() => {
    if (!isVisible) return;

    const target = step.target === 'body' ? document.body : document.querySelector(step.target);
    if (target) {
      setHighlightTarget(target as HTMLElement);
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentStep, isVisible, step.target]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  if (!isVisible) return null;

  const getTooltipPosition = () => {
    if (!highlightTarget || step.position === 'center') {
      return {
        position: 'fixed' as const,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 10001
      };
    }

    const rect = highlightTarget.getBoundingClientRect();
    const tooltipWidth = 380;
    const tooltipHeight = 200;

    switch (step.position) {
      case 'top':
        return {
          position: 'fixed' as const,
          top: rect.top - tooltipHeight - 20,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          zIndex: 10001
        };
      case 'bottom':
        return {
          position: 'fixed' as const,
          top: rect.bottom + 20,
          left: rect.left + rect.width / 2 - tooltipWidth / 2,
          zIndex: 10001
        };
      case 'left':
        return {
          position: 'fixed' as const,
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.left - tooltipWidth - 20,
          zIndex: 10001
        };
      case 'right':
        return {
          position: 'fixed' as const,
          top: rect.top + rect.height / 2 - tooltipHeight / 2,
          left: rect.right + 20,
          zIndex: 10001
        };
      default:
        return {
          position: 'fixed' as const,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 10001
        };
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999]"
          />

          {/* Highlight */}
          {highlightTarget && step.position !== 'center' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="fixed border-4 border-blue-400 rounded-lg shadow-lg pointer-events-none z-[10000]"
              style={{
                top: highlightTarget.getBoundingClientRect().top - 8,
                left: highlightTarget.getBoundingClientRect().left - 8,
                width: highlightTarget.getBoundingClientRect().width + 16,
                height: highlightTarget.getBoundingClientRect().height + 16,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)'
              }}
            />
          )}

          {/* Tour Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            style={getTooltipPosition()}
            className="w-96 z-[10001]"
          >
            <Card className="bg-white dark:bg-gray-900 border-2 border-blue-200 dark:border-blue-800 shadow-2xl">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${character.color} flex items-center justify-center text-2xl`}>
                      {character.emoji}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {character.name}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {character.personality}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSkip}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Progress */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Paso {currentStep + 1} de {tourSteps.length}
                    </span>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: tourSteps.length }).map((_, index) => (
                        <Star
                          key={index}
                          className={`h-3 w-3 ${
                            index <= currentStep
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300 dark:text-gray-600'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>

                {/* Content */}
                <div className="mb-6">
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {step.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300 mb-3">
                    {step.description}
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-400">
                    <p className="text-sm text-blue-800 dark:text-blue-200">
                      💬 {step.characterMessage}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevious}
                    disabled={currentStep === 0}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Anterior</span>
                  </Button>

                  <Button
                    onClick={handleNext}
                    size="sm"
                    className={`flex items-center space-x-2 bg-gradient-to-r ${character.color} text-white hover:opacity-90`}
                  >
                    <span>
                      {currentStep === tourSteps.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </span>
                    {currentStep === tourSteps.length - 1 ? (
                      <Sparkles className="h-4 w-4" />
                    ) : (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}