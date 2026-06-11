import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, RefreshCw, HelpCircle } from 'lucide-react';

export default function PaymentFailure() {
  return (
    <div className="min-h-screen bg-[#fafaf9] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl border border-gray-150 p-8 shadow-sm text-center"
        >
          {/* Failure icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            className="mx-auto w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-6"
          >
            <AlertTriangle size={32} />
          </motion.div>

          <h1 className="font-display text-3xl text-black mb-3">Payment Failed</h1>
          
          <p className="font-body text-sm text-gray-500 mb-6 leading-relaxed">
            We couldn't process your payment. This could be due to insufficient wallet balance, authorization timeouts, or cancellation of the transaction.
          </p>

          {/* Help Tips */}
          <div className="bg-gray-50 rounded-2xl p-5 text-left text-xs mb-8 space-y-3">
            <h4 className="font-semibold text-gray-700 flex items-center gap-1.5 mb-1">
              <HelpCircle size={14} className="text-gray-400" />
              What can you do?
            </h4>
            <ul className="space-y-2 text-gray-500 list-disc list-inside">
              <li>Check your eSewa wallet balance and limits.</li>
              <li>Ensure you have a stable network connection.</li>
              <li>Try again or select <b>Cash on Delivery (COD)</b> at checkout.</li>
            </ul>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Link
              to="/checkout"
              className="inline-flex justify-center items-center gap-2 w-full bg-black hover:bg-gray-900 text-white font-body text-sm font-semibold py-3.5 rounded-xl transition-colors"
            >
              <RefreshCw size={16} />
              Retry Checkout
            </Link>
            <Link
              to="/shop"
              className="inline-flex justify-center items-center gap-2 w-full bg-gray-100 hover:bg-gray-205 text-gray-700 font-body text-sm font-semibold py-3.5 rounded-xl transition-all"
            >
              <ArrowLeft size={16} />
              Back to Shopping
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
