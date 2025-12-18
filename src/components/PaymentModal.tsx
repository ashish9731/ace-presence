import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Smartphone, CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  amount: number;
  userId: string;
  onPaymentSubmitted: () => void;
}

// Google Pay QR Code - Base64 encoded
const GPAY_QR_CODE = "data:image/png;base64,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";

export function PaymentModal({ 
  isOpen, 
  onClose, 
  planName, 
  amount, 
  userId,
  onPaymentSubmitted 
}: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitPayment = async () => {
    if (!paymentMethod) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from("payments").insert({
        user_id: userId,
        plan_name: planName,
        amount: amount,
        currency: "USD",
        payment_method: paymentMethod,
        status: "pending",
      });

      if (error) throw error;

      setSubmitted(true);
      toast.success("Payment submitted for approval", {
        description: "Admin will verify your payment and activate your plan within 24 hours.",
      });
      
      setTimeout(() => {
        onPaymentSubmitted();
        onClose();
        setSubmitted(false);
        setPaymentMethod(null);
      }, 2000);
    } catch (error: any) {
      toast.error("Failed to submit payment", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      setPaymentMethod(null);
      setSubmitted(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-900">
            Upgrade to {planName.charAt(0).toUpperCase() + planName.slice(1)}
          </DialogTitle>
          <DialogDescription>
            Complete your payment to unlock premium features
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Submitted!</h3>
            <p className="text-sm text-gray-500">
              Your payment is pending admin approval. You'll be notified once activated.
            </p>
          </div>
        ) : (
          <>
            {/* Amount Display */}
            <div className="bg-[#C4A84D]/10 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Amount to pay</span>
                <span className="text-2xl font-bold text-[#C4A84D]">${amount}</span>
              </div>
            </div>

            {/* Payment Method Selection */}
            {!paymentMethod ? (
              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-700 mb-2">Select payment method:</p>
                
                <button
                  onClick={() => setPaymentMethod("upi")}
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-[#C4A84D] hover:bg-[#C4A84D]/5 transition-all"
                >
                  <div className="w-12 h-12 bg-[#C4A84D]/10 rounded-lg flex items-center justify-center">
                    <Smartphone className="w-6 h-6 text-[#C4A84D]" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">UPI Payment</p>
                    <p className="text-sm text-gray-500">Google Pay, PhonePe, Paytm</p>
                  </div>
                </button>

                <button
                  disabled
                  className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-lg opacity-50 cursor-not-allowed"
                >
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-gray-400" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-400">Card Payment</p>
                    <p className="text-sm text-gray-400">Coming Soon</p>
                  </div>
                </button>
              </div>
            ) : paymentMethod === "upi" ? (
              <div className="space-y-4">
                <button
                  onClick={() => setPaymentMethod(null)}
                  className="text-sm text-[#C4A84D] hover:underline"
                >
                  ← Back to payment methods
                </button>

                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700 mb-4">
                    Scan QR Code with Google Pay
                  </p>
                  
                  <div className="bg-white border-2 border-gray-100 rounded-xl p-4 inline-block mb-4">
                    <img
                      src={GPAY_QR_CODE}
                      alt="Google Pay QR Code"
                      className="w-48 h-48 mx-auto"
                    />
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">After payment, click confirm below</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 mb-4">
                    Amount: <span className="font-bold">${amount}</span> | 
                    Plan: <span className="font-bold">{planName}</span>
                  </p>

                  <Button
                    onClick={handleSubmitPayment}
                    disabled={submitting}
                    className="w-full bg-[#C4A84D] hover:bg-[#B39940] text-white"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "I've Completed Payment"
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
