import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const AccordionSection = ({ items = [] }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleSection = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="divide-y divide-[#F0E8E8] rounded-2xl bg-white">
      {items.map((item, idx) => (
        <div key={idx}>
          {/* Title Row */}
          <button
            type="button"
            onClick={() => toggleSection(idx)}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-homa-blush/50"
          >
            <span className={`font-body text-[15px] font-semibold ${openIndex === idx ? 'text-homa-red' : 'text-homa-black'}`}>
              {item.title}
            </span>
            {openIndex === idx ? (
              <Minus size={18} className="text-homa-red" />
            ) : (
              <Plus size={18} className="text-homa-red" />
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
                <div className="px-5 pb-5 pt-1 font-body text-sm leading-7 text-homa-grey">
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
