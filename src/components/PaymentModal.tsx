import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Smartphone, CheckCircle2, Clock, Sparkles, PartyPopper } from "lucide-react";
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
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (submitted) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

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
      toast.success("Payment submitted successfully! 🎉", {
        description: "Admin will verify and activate your plan within 24 hours.",
      });
      
      setTimeout(() => {
        onPaymentSubmitted();
        onClose();
        setSubmitted(false);
        setPaymentMethod(null);
      }, 4000);
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
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white via-amber-50/30 to-white border-amber-200/50 shadow-2xl">
        {/* Confetti Animation */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-lg">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute animate-bounce"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${0.5 + Math.random() * 0.5}s`,
                }}
              >
                <Sparkles 
                  className="w-4 h-4" 
                  style={{ 
                    color: ['#C4A84D', '#FFD700', '#FFA500', '#FF6B6B', '#4CAF50'][Math.floor(Math.random() * 5)] 
                  }} 
                />
              </div>
            ))}
          </div>
        )}

        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-[#C4A84D] to-[#B39940] rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#C4A84D] to-[#B39940] bg-clip-text text-transparent">
            Upgrade to {planName.charAt(0).toUpperCase() + planName.slice(1)}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            Unlock premium features and accelerate your executive presence journey
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-10 text-center relative">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-green-400/20 rounded-full animate-ping" />
              <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto relative z-10" />
            </div>
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <PartyPopper className="w-6 h-6 text-[#C4A84D]" />
                <h3 className="text-2xl font-bold text-gray-900">Congratulations!</h3>
                <PartyPopper className="w-6 h-6 text-[#C4A84D] scale-x-[-1]" />
              </div>
              <p className="text-lg text-green-600 font-medium">Payment Submitted Successfully!</p>
              <p className="text-sm text-gray-500 mt-4 max-w-xs mx-auto">
                Your payment is being verified. You'll receive access to {planName} features within 24 hours.
              </p>
            </div>
            <div className="mt-6 flex justify-center gap-2">
              {[...Array(5)].map((_, i) => (
                <div 
                  key={i} 
                  className="w-2 h-2 rounded-full bg-[#C4A84D] animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Amount Display */}
            <div className="bg-gradient-to-r from-[#C4A84D]/10 via-amber-100/50 to-[#C4A84D]/10 rounded-xl p-5 mb-6 border border-[#C4A84D]/20">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-600 block">Amount to pay</span>
                  <span className="text-xs text-gray-400">(Test mode: $1)</span>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-bold bg-gradient-to-r from-[#C4A84D] to-[#B39940] bg-clip-text text-transparent">${amount}</span>
                  <span className="text-sm text-gray-500 block">USD</span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            {!paymentMethod ? (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Select payment method:</p>
                
                <button
                  onClick={() => setPaymentMethod("upi")}
                  className="w-full flex items-center gap-4 p-5 border-2 border-gray-100 rounded-xl hover:border-[#C4A84D] hover:bg-gradient-to-r hover:from-[#C4A84D]/5 hover:to-amber-50/30 transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#C4A84D] to-[#B39940] rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <Smartphone className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 text-lg">UPI Payment</p>
                    <p className="text-sm text-gray-500">Google Pay, PhonePe, Paytm</p>
                  </div>
                  <div className="text-[#C4A84D] font-medium text-sm">Recommended</div>
                </button>

                <button
                  disabled
                  className="w-full flex items-center gap-4 p-5 border-2 border-gray-100 rounded-xl opacity-50 cursor-not-allowed"
                >
                  <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-7 h-7 text-gray-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-400 text-lg">Card Payment</p>
                    <p className="text-sm text-gray-400">Visa, Mastercard, Amex</p>
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-500">Coming Soon</div>
                </button>
              </div>
            ) : paymentMethod === "upi" ? (
              <div className="space-y-5">
                <button
                  onClick={() => setPaymentMethod(null)}
                  className="text-sm text-[#C4A84D] hover:underline font-medium flex items-center gap-1"
                >
                  ← Back to payment methods
                </button>

                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    Scan QR Code with Google Pay
                  </p>
                  
                  <div className="bg-white border-4 border-[#C4A84D]/20 rounded-2xl p-6 inline-block shadow-xl hover:shadow-2xl transition-shadow">
                    <img
                      src="/gpay-qr.png"
                      alt="Google Pay QR Code"
                      className="w-56 h-56 mx-auto object-contain"
                    />
                  </div>

                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-xs text-blue-700 font-medium">
                      💡 Payment will show as: "Executive Presence Tool - {planName} Plan"
                    </p>
                  </div>

                  <div className="mt-4 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-2 text-amber-700">
                      <Clock className="w-5 h-5" />
                      <span className="font-medium">After payment, click confirm below</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-500">
                    <span>Amount: <span className="font-bold text-[#C4A84D]">${amount}</span></span>
                    <span className="w-1 h-1 bg-gray-300 rounded-full" />
                    <span>Plan: <span className="font-bold text-gray-700">{planName}</span></span>
                  </div>

                  <Button
                    onClick={handleSubmitPayment}
                    disabled={submitting}
                    className="w-full mt-6 h-14 bg-gradient-to-r from-[#C4A84D] to-[#B39940] hover:from-[#B39940] hover:to-[#A38830] text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 mr-2" />
                        I've Completed Payment
                      </>
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
