import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CreditCard, Smartphone, CheckCircle2, Clock, Sparkles, PartyPopper, ArrowLeft } from "lucide-react";
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

type PaymentStep = "method" | "upi-select" | "upi-confirm" | "card-form" | "card-confirm";
type UPIProvider = "gpay" | "paytm" | "phonepe";

export function PaymentModal({ 
  isOpen, 
  onClose, 
  planName, 
  amount, 
  userId,
  onPaymentSubmitted 
}: PaymentModalProps) {
  const [step, setStep] = useState<PaymentStep>("method");
  const [selectedUPI, setSelectedUPI] = useState<UPIProvider | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  // Card form state
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");

  useEffect(() => {
    if (submitted) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [submitted]);

  const resetState = () => {
    setStep("method");
    setSelectedUPI(null);
    setSubmitted(false);
    setCardNumber("");
    setCardName("");
    setExpiryDate("");
    setCvv("");
  };

  const handleSubmitPayment = async (method: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("payments").insert({
        user_id: userId,
        plan_name: planName,
        amount: amount,
        currency: "USD",
        payment_method: method,
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
        resetState();
      }, 4000);
    } catch (error: any) {
      toast.error("Failed to submit payment", { description: error.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      resetState();
      onClose();
    }
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const isCardFormValid = () => {
    return cardNumber.replace(/\s/g, "").length >= 16 && 
           cardName.length >= 3 && 
           expiryDate.length === 5 && 
           cvv.length >= 3;
  };

  const upiProviders = [
    { id: "gpay" as UPIProvider, name: "Google Pay", color: "from-blue-500 to-blue-600", icon: "G" },
    { id: "paytm" as UPIProvider, name: "Paytm", color: "from-sky-400 to-sky-500", icon: "P" },
    { id: "phonepe" as UPIProvider, name: "PhonePe", color: "from-purple-500 to-purple-600", icon: "Ph" },
  ];

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
                  <span className="text-xs text-gray-400">(Mock payment for testing)</span>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-bold bg-gradient-to-r from-[#C4A84D] to-[#B39940] bg-clip-text text-transparent">${amount}</span>
                  <span className="text-sm text-gray-500 block">USD</span>
                </div>
              </div>
            </div>

            {/* Step: Payment Method Selection */}
            {step === "method" && (
              <div className="space-y-4">
                <p className="text-sm font-semibold text-gray-700 mb-3">Select payment method:</p>
                
                <button
                  onClick={() => setStep("upi-select")}
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
                  onClick={() => setStep("card-form")}
                  className="w-full flex items-center gap-4 p-5 border-2 border-gray-100 rounded-xl hover:border-[#C4A84D] hover:bg-gradient-to-r hover:from-[#C4A84D]/5 hover:to-amber-50/30 transition-all group shadow-sm hover:shadow-md"
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-gray-600 to-gray-800 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    <CreditCard className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-semibold text-gray-900 text-lg">Card Payment</p>
                    <p className="text-sm text-gray-500">Visa, Mastercard, Amex, RuPay</p>
                  </div>
                  <div className="text-gray-400 font-medium text-sm">All cards</div>
                </button>
              </div>
            )}

            {/* Step: UPI Provider Selection */}
            {step === "upi-select" && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep("method")}
                  className="text-sm text-[#C4A84D] hover:underline font-medium flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to payment methods
                </button>

                <p className="text-sm font-semibold text-gray-700">Select UPI app:</p>
                
                <div className="grid grid-cols-3 gap-3">
                  {upiProviders.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        setSelectedUPI(provider.id);
                        setStep("upi-confirm");
                      }}
                      className="flex flex-col items-center gap-2 p-4 border-2 border-gray-100 rounded-xl hover:border-[#C4A84D] hover:shadow-md transition-all"
                    >
                      <div className={`w-14 h-14 bg-gradient-to-br ${provider.color} rounded-xl flex items-center justify-center shadow-md`}>
                        <span className="text-white font-bold text-lg">{provider.icon}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700">{provider.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step: UPI Confirmation */}
            {step === "upi-confirm" && selectedUPI && (
              <div className="space-y-5">
                <button
                  onClick={() => setStep("upi-select")}
                  className="text-sm text-[#C4A84D] hover:underline font-medium flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to UPI apps
                </button>

                <div className="text-center">
                  <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${upiProviders.find(p => p.id === selectedUPI)?.color} rounded-2xl flex items-center justify-center shadow-lg mb-4`}>
                    <span className="text-white font-bold text-2xl">
                      {upiProviders.find(p => p.id === selectedUPI)?.icon}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {upiProviders.find(p => p.id === selectedUPI)?.name} Payment
                  </h3>
                  
                  <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4 mb-4">
                    <p className="text-sm text-amber-700">
                      <Clock className="w-4 h-4 inline mr-2" />
                      Open {upiProviders.find(p => p.id === selectedUPI)?.name} app and complete the payment of <strong>${amount}</strong>
                    </p>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <p className="text-xs text-gray-500 mb-1">UPI ID (Mock)</p>
                    <p className="font-mono text-gray-800 font-medium">epquotient@{selectedUPI}</p>
                  </div>

                  <Button
                    onClick={() => handleSubmitPayment(`upi_${selectedUPI}`)}
                    disabled={submitting}
                    className="w-full h-14 bg-gradient-to-r from-[#C4A84D] to-[#B39940] hover:from-[#B39940] hover:to-[#A38830] text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
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
            )}

            {/* Step: Card Form */}
            {step === "card-form" && (
              <div className="space-y-4">
                <button
                  onClick={() => setStep("method")}
                  className="text-sm text-[#C4A84D] hover:underline font-medium flex items-center gap-1"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to payment methods
                </button>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cardNumber" className="text-sm font-medium text-gray-700">Card Number</Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      maxLength={19}
                      className="mt-1"
                    />
                    <div className="flex gap-1 mt-2">
                      <div className="w-8 h-5 bg-blue-600 rounded text-[8px] text-white flex items-center justify-center font-bold">VISA</div>
                      <div className="w-8 h-5 bg-red-500 rounded text-[8px] text-white flex items-center justify-center font-bold">MC</div>
                      <div className="w-8 h-5 bg-blue-400 rounded text-[8px] text-white flex items-center justify-center font-bold">AMEX</div>
                      <div className="w-8 h-5 bg-green-600 rounded text-[8px] text-white flex items-center justify-center font-bold">RuPay</div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="cardName" className="text-sm font-medium text-gray-700">Name on Card</Label>
                    <Input
                      id="cardName"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry" className="text-sm font-medium text-gray-700">Expiry Date</Label>
                      <Input
                        id="expiry"
                        placeholder="MM/YY"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(formatExpiry(e.target.value))}
                        maxLength={5}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cvv" className="text-sm font-medium text-gray-700">CVV</Label>
                      <Input
                        id="cvv"
                        type="password"
                        placeholder="•••"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        maxLength={4}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-green-700">Your payment is secured with 256-bit encryption</span>
                  </div>

                  <Button
                    onClick={() => handleSubmitPayment("card")}
                    disabled={submitting || !isCardFormValid()}
                    className="w-full h-14 bg-gradient-to-r from-[#C4A84D] to-[#B39940] hover:from-[#B39940] hover:to-[#A38830] text-white font-semibold text-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay ${amount}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
