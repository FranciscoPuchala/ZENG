import * as React from "react"
import { AnimatePresence, motion } from "motion/react"
import { CheckCircle2, X } from "lucide-react"

export function Toast({
  message,
  visible,
  onClose,
}: {
  message: string
  visible: boolean
  onClose: () => void
}) {
  React.useEffect(() => {
    if (!visible) return
    const t = setTimeout(onClose, 3500)
    return () => clearTimeout(t)
  }, [visible, onClose])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-green-200 bg-white px-4 py-3 shadow-lg"
        >
          <CheckCircle2 className="size-4 shrink-0 text-green-600" />
          <p className="text-sm font-medium text-foreground">{message}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar notificación"
            className="ml-1 rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
          >
            <X className="size-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
