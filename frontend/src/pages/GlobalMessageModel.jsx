import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GlobalMessageModal({ visible, type, message, onClose }) {
 
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onClose();
    }, 10000); // 10 seconds
    return () => clearTimeout(timer);
  }, [visible, onClose]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 flex items-center justify-center z-50"
        >
          {/* Background Blur Overlay */}
          <div className="absolute inset-0 backdrop-blur-md bg-black/40" />

          {/* Modal Box */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="relative w-[90%] max-w-md p-6 rounded-2xl shadow-2xl bg-gradient-to-b from-neutral-900 to-neutral-700 border border-neutral-600 text-white"
          >
            <h2
              className={`text-xl font-semibold mb-3 ${
                type === "error" ? "text-red-400" : type===" neutral"?"text-yellow-400" :"text-green-400"
              }`}
            >
              {type === "error" ? "Error" : "Success"}
            </h2>

            <p className="text-neutral-200 mb-6 whitespace-pre-wrap">{message}</p>

            <div className="flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-neutral-500 transition"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
