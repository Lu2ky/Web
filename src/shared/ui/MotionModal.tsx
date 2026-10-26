import { motion, HTMLMotionProps } from "motion/react";
import { SPRING_MODAL_ENTER, SPRING_MODAL_EXIT, SPRING_POPOVER } from "../lib/motion";

interface MotionModalProps extends Omit<HTMLMotionProps<"div">, "animate" | "initial" | "exit"> {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** "modal" = centrado, "popover" = anclado al trigger (requiere --transform-origin) */
  variant?: "modal" | "popover";
  /** Elemento que abrió el modal (para transform-origin en popovers) */
  triggerRef?: React.RefObject<HTMLElement>;
}

export function MotionModal({ 
  isOpen, 
  onClose, 
  children, 
  variant = "modal",
  triggerRef,
  className = "",
  style,
  ...props 
}: MotionModalProps) {
  const enterConfig = variant === "popover" ? SPRING_POPOVER : SPRING_MODAL_ENTER;
  const exitConfig = variant === "popover" ? SPRING_POPOVER : SPRING_MODAL_EXIT;

  // Configurar transform-origin para popovers anclados
  const transformOrigin = variant === "popover" && triggerRef?.current
    ? `var(--transform-origin, center)`
    : "center";

  return (
    <motion.div
      className={className}
      style={{ 
        ...style, 
        transformOrigin,
        // Variables CSS para popover positioning
        ...(variant === "popover" && triggerRef?.current && {
          '--transform-origin': 'center' // fallback, se actualiza via JS si hace falta
        })
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={isOpen ? enterConfig : exitConfig}
      onAnimationComplete={!isOpen ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      {...props}
    >
      {children}
    </motion.div>
  );
}

/** Overlay con fade simple (no spring) */
export function MotionOverlay({ isOpen, onClose, className = "", ...props }: {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      onClick={onClose}
      role="presentation"
      {...props}
    />
  );
}
