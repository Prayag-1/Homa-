import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const AccordionSection = ({ items = [] }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleSection = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="divide-y divide-gray-200">
      {items.map((item, idx) => (
        <div key={idx}>
          {/* Title Row */}
          <button
            type="button"
            onClick={() => toggleSection(idx)}
            className="w-full py-4 px-0 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
          >
            <span className="font-display text-base text-black">
              {item.title}
            </span>
            {openIndex === idx ? (
              <Minus size={18} className="text-gray-600" />
            ) : (
              <Plus size={18} className="text-gray-600" />
            )}
          </button>

          {/* Content */}
          <AnimatePresence initial={false}>
            {openIndex === idx && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{
                  duration: 0.3,
                  ease: 'easeInOut',
                }}
                className="overflow-hidden"
              >
                <div className="py-4 px-0 text-gray-700 font-body text-sm leading-relaxed">
                  {typeof item.content === 'string' ? (
                    <p>{item.content}</p>
                  ) : (
                    item.content
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

export default AccordionSection;
