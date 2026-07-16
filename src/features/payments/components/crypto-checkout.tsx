"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useSession } from "next-auth/react";
import { getDb } from "@/lib/firestore";
import { doc, setDoc, collection, addDoc, serverTimestamp } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { useCartStore } from "@/store/useCartStore";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  Loader2,
  ScanQrCode,
  ShieldCheck,
  X,
  ImageIcon,
  Copy,
  Check,
  Coins,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Maximize2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrencyStore, CURRENCY_SYMBOLS } from "@/store/useCurrencyStore";
import { motion, AnimatePresence } from "framer-motion";
// Removed getLiveCryptoRates API import
interface CryptoPaymentCheckoutProps {
  orderId: string;
  amount: number; // in USD (default store pricing is USD)
  customerEmail: string;
}

interface CoinOption {
  id: string;
  name: string;
  network: string;
  address: string;
  icon: string;
  qrPrefix?: string;
  ticker: string;
}

const COIN_OPTIONS: CoinOption[] = [
  {
    id: "btc",
    name: "Bitcoin",
    network: "BTC Network",
    address: "bc1qtd309hq8q38ndzs253938e92nqh9zdyekn674y",
    icon: "https://cdn.simpleicons.org/bitcoin",
    qrPrefix: "bitcoin:",
    ticker: "BTC",
  },
  {
    id: "eth",
    name: "Ethereum",
    network: "ERC-20",
    address: "0x7C16bCa7C046db092f420c96C3923DE26b0bA279",
    icon: "https://cdn.simpleicons.org/ethereum",
    qrPrefix: "ethereum:",
    ticker: "ETH",
  },
  {
    id: "usdt-erc20",
    name: "USDT",
    network: "ERC-20",
    address: "0x7C16bCa7C046db092f420c96C3923DE26b0bA279",
    icon: "https://cdn.simpleicons.org/tether",
    qrPrefix: "ethereum:",
    ticker: "USDT",
  },
  {
    id: "usdt-sol",
    name: "USDT",
    network: "Solana",
    address: "2UjaBJqSm7GzbdTdv2yNAx5rPYMPy41bLPeuZPtssKQg",
    icon: "https://cdn.simpleicons.org/tether",
    qrPrefix: "solana:",
    ticker: "USDT",
  },
  {
    id: "usdt-trc20",
    name: "USDT",
    network: "TRC-20",
    address: "TVtictVGRmWvAU8Tu1qnftT4SVWiBErm9k",
    icon: "https://cdn.simpleicons.org/tether",
    qrPrefix: "tron:",
    ticker: "USDT",
  },
  {
    id: "bnb",
    name: "BNB",
    network: "BSC Network",
    address: "0x7C16bCa7C046db092f420c96C3923DE26b0bA279",
    icon: "https://cdn.simpleicons.org/binance",
    qrPrefix: "ethereum:",
    ticker: "BNB",
  },
  {
    id: "xrp",
    name: "XRP",
    network: "XRP Network",
    address: "rM9i5Kkh6MogRYyhqMWk8wfwQisyyW39yc",
    icon: "https://cdn.simpleicons.org/xrp",
    qrPrefix: "ripple:",
    ticker: "XRP",
  },
  {
    id: "sol",
    name: "Solana",
    network: "SOL Network",
    address: "2UjaBJqSm7GzbdTdv2yNAx5rPYMPy41bLPeuZPtssKQg",
    icon: "https://cdn.simpleicons.org/solana",
    qrPrefix: "solana:",
    ticker: "SOL",
  },
  {
    id: "ltc",
    name: "Litecoin",
    network: "LTC Network",
    address: "LNHkjPqtSXgZ1WL5LZvWurxQmPA4p4xXKE",
    icon: "https://cdn.simpleicons.org/litecoin",
    qrPrefix: "litecoin:",
    ticker: "LTC",
  },
  {
    id: "trx",
    name: "Tron",
    network: "TRC-20",
    address: "TVtictVGRmWvAU8Tu1qnftT4SVWiBErm9k",
    icon: "https://cdn.simpleicons.org/tron",
    qrPrefix: "tron:",
    ticker: "TRX",
  },
  {
    id: "doge",
    name: "Dogecoin",
    network: "DOGE Network",
    address: "DGzkNM5dLzdJv1A2ksRgbzbi3uQAA7WW8M",
    icon: "https://cdn.simpleicons.org/dogecoin",
    qrPrefix: "dogecoin:",
    ticker: "DOGE",
  }
];




export function CryptoPaymentCheckout({
  orderId,
  amount, // base USD amount
  customerEmail,
}: CryptoPaymentCheckoutProps) {
  const { data: session } = useSession();
  const [selectedCoin, setSelectedCoin] = useState<CoinOption | null>(null);
  const [txHash, setTxHash] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isQrExpanded, setIsQrExpanded] = useState(false);

  const getQrValue = () => {
    if (!selectedCoin) return "";
    return selectedCoin.qrPrefix ? `${selectedCoin.qrPrefix}${selectedCoin.address}` : selectedCoin.address;
  };

  const { currency: selectedCurrency, rates } = useCurrencyStore();

  const selectedRate = rates[selectedCurrency] || 1.0;
  const amountInSelected = amount * selectedRate;

  const formatSelected = () => {
    const symbol = CURRENCY_SYMBOLS[selectedCurrency] || "$";
    const hasDecimals = amountInSelected % 1 !== 0;
    const formatted = (selectedCurrency === "JPY" || !hasDecimals)
      ? Math.round(amountInSelected).toLocaleString()
      : amountInSelected.toFixed(2);
    return `${symbol}${formatted} ${selectedCurrency}`;
  };

  const handleCopyAddress = () => {
    if (!selectedCoin) return;
    navigator.clipboard.writeText(selectedCoin.address);
    setCopiedAddress(true);
    setTimeout(() => setCopiedAddress(false), 2000);
  };

  const handleFileChange = useCallback((file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Screenshot must be less than 5MB.");
      return;
    }
    setScreenshotFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => setScreenshotPreview(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      handleFileChange(e.dataTransfer.files?.[0] ?? null);
    },
    [handleFileChange]
  );

  const toBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedCoin) {
      setError("Please select a coin first.");
      return;
    }
    if (!txHash || txHash.trim().length < 8) {
      setError("Please enter a valid Crypto Transaction Hash (TxHash).");
      return;
    }
    if (!screenshotFile) {
      setError("Please upload a screenshot of the payment proof.");
      return;
    }

    setIsSubmitting(true);
    try {
      const screenshotBase64 = await toBase64(screenshotFile);
      const res = await fetch("/api/payments/submit-crypto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          amount,
          customerEmail,
          coinSelected: `${selectedCoin.name} (${selectedCoin.network})`,
          txHash,
          screenshotBase64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Submission failed.");

      // Create support chat for order payment proof verification
      try {
        const userId = (session?.user as any)?.id as string || "N/A";
        const username = (session?.user as any)?.username || session?.user?.name || session?.user?.email || "User";
        const db = getDb();
        const chatId = `order-${orderId}`;
        const chatRef = doc(db, "supportChats", chatId);

        const messageText = `📦 ORDER PAID & SUBMITTED (Crypto)
----------------------------------
Order ID: ${orderId}
Base USD Amount: $${amount.toLocaleString()}
Selected Coin: ${selectedCoin.name} (${selectedCoin.network})
Payment Method: Cryptocurrency

👤 USER DETAILS:
----------------------------------
Username: ${username}
Email: ${customerEmail}
User ID: ${userId}

🔍 VERIFICATION PROOF:
----------------------------------
TxHash / Hash ID: #${txHash}
Payment Screenshot: Uploaded & Stored

Please verify my payment proof and approve my order!`;

        await setDoc(chatRef, {
          userId,
          username,
          email: customerEmail,
          type: "order",
          orderId,
          title: `Order #${orderId.substring(0, 8).toUpperCase()}`,
          lastMessage: `Payment proof submitted (Crypto Hash: #${txHash.substring(0, 8)}...).`,
          lastMessageAt: serverTimestamp(),
          unreadByAdmin: 1,
          unreadByUser: 0,
          createdAt: serverTimestamp(),
          paymentMethod: "Crypto",
        });

        const msgsRef = collection(db, "supportChats", chatId, "messages");
        await addDoc(msgsRef, {
          text: messageText,
          sender: "user",
          senderName: username,
          timestamp: serverTimestamp(),
          read: false,
        });

        if (data.screenshotUrl) {
          await addDoc(msgsRef, {
            image: data.screenshotUrl,
            text: "Payment Proof Screenshot",
            sender: "user",
            senderName: username,
            timestamp: serverTimestamp(),
            read: false,
          });
        }

        await addDoc(msgsRef, {
          text: `System: Thank you for submitting your payment proof! A support representative will verify your Crypto TxHash #${txHash} shortly and confirm your order.`,
          sender: "admin",
          senderName: "Support Team",
          timestamp: serverTimestamp(),
          read: false,
        });

        useCartStore.getState().clearCart();
        setSubmitted(true);
        window.location.href = `/chat?chatId=${chatId}`;
      } catch (fErr) {
        console.error("Failed to write to support chats:", fErr);
        setSubmitted(true);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Success State ────────────────────────────────────────────────────────
  if (submitted && selectedCoin) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-b from-amber-500/[0.08] to-transparent dark:from-amber-500/[0.04] p-6 text-center shadow-xl backdrop-blur-md">
        <div className="absolute -top-12 -left-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-amber-500/20 animate-ping opacity-75" />
            <div className="relative h-16 w-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-amber-500 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight text-zinc-955 dark:text-white uppercase">
              Proof Submitted
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Your cryptocurrency transaction details have been sent for verification.
            </p>
          </div>

          <div className="w-full bg-white/40 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/40 rounded-xl p-4 space-y-3 text-xs text-left relative">
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-white dark:bg-[#111111] rounded-r-full border-r border-zinc-200 dark:border-zinc-800" />
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-6 bg-white dark:bg-[#111111] rounded-l-full border-l border-zinc-200 dark:border-zinc-800" />

            <div className="flex justify-between items-center pb-2 border-b border-dashed border-zinc-200 dark:border-zinc-800">
              <span className="text-zinc-500 font-medium">Verification Status</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                Pending Verification
              </span>
            </div>

            <div className="space-y-2 pt-1 font-medium">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Method:</span>
                <span className="font-bold text-zinc-900 dark:text-zinc-200">
                  {selectedCoin.name} ({selectedCoin.network})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500">Tx Hash:</span>
                <span className="font-mono text-zinc-900 dark:text-zinc-200 font-bold bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded max-w-[150px] truncate" title={txHash}>
                  {txHash}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Amount Paid:</span>
                <span className="font-bold text-zinc-950 dark:text-white">
                  ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">ETA Confirmation:</span>
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">1 – 12 Hours</span>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 max-w-xs leading-relaxed">
            🚀 Once the transaction has enough block confirmations, our admin will approve it to fulfill your order.
          </p>

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-450 dark:text-zinc-550 pt-2">
            <ShieldCheck className="h-4 w-4 text-amber-500" />
            <span>Secured Crypto Verification</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-stretch text-left">
      
      {/* Screen 1: Select Coin & Render details */}
      <div className={cn(
        "rounded-2xl border border-zinc-200/85 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-[#151515]/30 p-5 flex flex-col justify-between space-y-4",
        step !== 1 && "hidden sm:flex"
      )}>
        
        <div className="space-y-4">
          {/* Header Title */}
          <div className="flex items-center gap-2">
            <span className="h-5.5 w-5.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black flex items-center justify-center shrink-0 border border-amber-500/20">
              1
            </span>
            <h3 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Select Crypto Coin
            </h3>
          </div>

          {/* Amount Card */}
          <div className="flex flex-col items-center justify-center bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl py-3 shadow-sm">
             <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider mb-0.5">Amount to Pay (USD)</p>
             <p className="text-2xl font-black text-zinc-950 dark:text-white tracking-tight">
               ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
             </p>
          </div>

          {/* Currency conversion animation box */}
          {selectedCurrency !== "USD" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-zinc-100/50 dark:bg-zinc-900/30 border border-zinc-200/40 dark:border-zinc-800/20 rounded-xl p-2.5 flex items-center justify-center gap-2 text-center"
            >
              <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500">
                Equivalent:
              </span>
              <span className="text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                {formatSelected()}
              </span>
            </motion.div>
          )}

          {/* Coin selectors */}
          <div className="space-y-2 relative">
            <p className="text-[9px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block">
              Choose Currency:
            </p>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-amber-500 transition-colors shadow-sm focus:outline-none"
              >
                {selectedCoin ? (
                  <div className="flex items-center gap-2.5">
                    <img src={selectedCoin.icon} alt={selectedCoin.name} className="h-5 w-5 object-contain" />
                    <div className="text-left leading-tight">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">{selectedCoin.name}</p>
                      <span className="text-[9px] text-zinc-450 font-medium">{selectedCoin.network}</span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-zinc-400">Select a cryptocurrency...</span>
                )}
                <ChevronDown className={cn("h-4 w-4 text-zinc-400 transition-transform duration-200", isDropdownOpen && "rotate-180")} />
              </button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="w-full mt-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden max-h-56 overflow-y-auto"
                  >
                    {COIN_OPTIONS.map((coin) => (
                      <button
                        key={coin.id}
                        type="button"
                        onClick={() => {
                          setSelectedCoin(coin);
                          setIsDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-2.5 p-3 text-left transition-colors cursor-pointer border-b border-zinc-100 dark:border-zinc-800/50 last:border-b-0 hover:bg-zinc-50 dark:hover:bg-zinc-800",
                          selectedCoin?.id === coin.id ? "bg-amber-500/5 text-amber-600 dark:text-amber-400" : "text-zinc-700 dark:text-zinc-300"
                        )}
                      >
                        <img src={coin.icon} alt={coin.name} className="h-5 w-5 object-contain" />
                        <div className="leading-tight">
                          <p className="text-xs font-bold text-zinc-900 dark:text-white group-hover:text-amber-500">{coin.name}</p>
                          <span className="text-[9px] text-zinc-450 font-medium">{coin.network}</span>
                        </div>
                        {selectedCoin?.id === coin.id && (
                          <Check className="h-4 w-4 ml-auto text-amber-500" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Address Details with Animation */}
          <AnimatePresence mode="wait">
            {selectedCoin ? (
              <motion.div
                key={selectedCoin.id}
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.98 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="bg-white dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 rounded-xl p-4 space-y-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wide border border-amber-500/20">
                    {selectedCoin.name} Address ({selectedCoin.network})
                  </span>
                  <div className="flex items-center gap-1 text-[9px] text-zinc-400 dark:text-zinc-500">
                    <RefreshCw className="h-2.5 w-2.5 animate-spin-slow text-amber-500" />
                    <span>Send exactly {amount} USD</span>
                  </div>
                </div>

                {/* QR Code and Copy Block */}
                <div className="flex items-center gap-4">
                  <div 
                    onClick={() => setIsQrExpanded(true)}
                    className="p-2 bg-white rounded-lg border border-zinc-200 dark:border-zinc-800 shadow-xs shrink-0 cursor-pointer relative group/qr hover:border-amber-500 transition-colors"
                    title="Click to expand QR Code"
                  >
                    <QRCodeSVG
                      value={getQrValue()}
                      size={70}
                      bgColor="#ffffff"
                      fgColor="#18181b"
                      level="M"
                      includeMargin={false}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/qr:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-lg text-white gap-0.5">
                      <Maximize2 className="h-3.5 w-3.5" />
                      <span className="text-[7px] font-bold tracking-tight uppercase text-center text-white">Enlarge</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-1.5 min-w-0 text-left">
                    <span className="text-[8px] text-zinc-450 dark:text-zinc-550 font-bold uppercase tracking-wider block">Wallet Address</span>
                    <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950/80 p-2 rounded-lg border border-zinc-200/50 dark:border-zinc-800/40 relative">
                      <span className="font-mono text-[9px] text-zinc-800 dark:text-zinc-300 font-medium select-all break-all pr-5">
                        {selectedCoin.address}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyAddress}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 rounded flex items-center justify-center hover:bg-zinc-200 dark:hover:bg-zinc-900 text-zinc-450 hover:text-zinc-700 dark:hover:text-zinc-200 transition cursor-pointer bg-transparent border-none"
                      >
                        {copiedAddress ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quantity to Pay Block Removed */}

                {/* Gas Fees Warning Box */}
                <div className="bg-amber-500/10 dark:bg-amber-500/[0.05] border border-amber-500/30 dark:border-amber-550/20 rounded-xl p-3 flex items-start gap-2 text-left">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-0.5">Gas Fees & Network Fees</p>
                    <p className="text-[9px] text-zinc-600 dark:text-zinc-300 font-medium leading-relaxed">
                      You must pay the extra gas/network fees. Send exactly the amount shown above plus whatever fee your wallet/exchange requires. <span className="font-bold text-amber-600 dark:text-amber-400">If the received amount is less, it will result in partial payment.</span>
                    </p>
                  </div>
                </div>

                <p className="text-[9px] text-red-500/80 dark:text-red-400/80 font-semibold leading-normal flex items-start gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0 mt-0.5" />
                  <span>Send ONLY {selectedCoin.name} over {selectedCoin.network}. Sending other coins will lose funds.</span>
                </p>
              </motion.div>
            ) : (
              <div className="py-8 text-center rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white/20 dark:bg-zinc-900/10">
                <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-bold uppercase tracking-wider">
                  Select a Coin to show payment details
                </p>
              </div>
            )}
          </AnimatePresence>

          {/* Button to Screen 2 */}
          {selectedCoin && (
            <button
              type="button"
              onClick={() => setStep(2)}
              className="w-full h-11 flex sm:hidden items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 text-white font-extrabold text-xs transition-all active:scale-[0.98] shadow-md shadow-amber-500/15 cursor-pointer mt-2"
            >
              <Check className="h-4.5 w-4.5 text-amber-200 animate-pulse" />
              I HAVE SENT PAYMENT, SUBMIT PROOF
            </button>
          )}

        </div>

      </div>

      {/* Screen 2: Verification Input form */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "rounded-2xl border border-zinc-200/85 dark:border-white/[0.06] bg-zinc-50/50 dark:bg-[#151515]/30 p-5 flex flex-col justify-between space-y-4",
          step !== 2 && "hidden sm:flex"
        )}
      >
        
        {/* Header Title */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <span className="h-5.5 w-5.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11px] font-black flex items-center justify-center shrink-0 border border-amber-500/20">
              2
            </span>
            <h3 className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              Submit Crypto Proof
            </h3>
          </div>
          <button
            type="button"
            onClick={() => setStep(1)}
            className="block sm:hidden text-[10px] font-bold text-zinc-500 hover:text-amber-500 transition cursor-pointer bg-transparent border-none"
          >
            &larr; Back
          </button>
        </div>

        {/* Transaction Hash Input */}
        <div className="space-y-1.5 text-left">
          <label className="text-[9px] font-extrabold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block">
            Transaction Hash (TxHash / TxID)
          </label>
          <div className="relative">
            <input
              type="text"
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
              placeholder="e.g. 0x5a18b52f9c5d0a6..."
              className="w-full h-9 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 text-xs font-mono text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition shadow-xs"
            />
          </div>
        </div>

        {/* Screenshot Upload preview */}
        <div className="space-y-1.5 flex-1 flex flex-col justify-center text-left">
          {screenshotPreview ? (
            <div className="relative rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 max-h-36 shadow-xs group">
              <img
                src={screenshotPreview}
                alt="Receipt screenshot preview"
                className="w-full h-full max-h-32 object-contain bg-white dark:bg-zinc-900"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setScreenshotFile(null);
                    setScreenshotPreview(null);
                  }}
                  className="h-8 w-8 rounded-full bg-red-600 text-white flex items-center justify-center hover:bg-red-500 transition-all cursor-pointer border-none shadow-md hover:scale-105 active:scale-95"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-900 py-4 px-3 text-center cursor-pointer transition duration-200 flex-1 min-h-[90px] shadow-xs group hover:border-amber-500"
            >
              <ImageIcon className="h-5 w-5 text-zinc-400 group-hover:text-amber-500 transition-colors" />
              <div>
                <p className="text-[10px] font-bold text-zinc-600 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors">
                  Upload screenshot proof
                </p>
                <p className="text-[8px] text-zinc-450 dark:text-zinc-500 mt-0.5">
                  Drag &amp; drop or click to browse (Max 5MB)
                </p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="flex items-start gap-1.5 rounded-lg bg-red-50 dark:bg-red-500/[0.07] border border-red-200 dark:border-red-500/20 p-2 text-left">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-650 dark:text-red-400 leading-normal">{error}</p>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500 disabled:from-zinc-500 disabled:to-zinc-500 disabled:opacity-60 text-white text-xs font-bold transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-amber-500/15"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Submitting proof...
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5" />
              SUBMIT PAYMENT PROOF
            </>
          )}
        </button>

      </form>

      {/* Expanded QR Modal Overlay */}
      {isQrExpanded && selectedCoin && (
        <div
          onClick={() => setIsQrExpanded(false)}
          className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md cursor-pointer animate-in fade-in duration-250"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white dark:bg-[#111111] p-8 rounded-2xl border border-zinc-200 dark:border-white/[0.06] shadow-2xl flex flex-col items-center gap-4 text-center cursor-default max-w-sm w-full animate-in zoom-in-95 duration-200"
          >
            <button
              onClick={() => setIsQrExpanded(false)}
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="space-y-1">
              <h4 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
                Scan {selectedCoin.name} QR
              </h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-450">
                Network: <span className="font-extrabold text-amber-500 uppercase">{selectedCoin.network}</span>
              </p>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-zinc-200 shadow-sm shrink-0">
              <QRCodeSVG
                value={getQrValue()}
                size={220}
                bgColor="#ffffff"
                fgColor="#18181b"
                level="Q"
                includeMargin={false}
              />
            </div>

            <div className="w-full space-y-1.5 text-left">
              <span className="text-[8px] text-zinc-450 dark:text-zinc-500 font-bold uppercase tracking-wider block">Wallet Address</span>
              <div className="font-mono text-[10px] text-zinc-800 dark:text-zinc-300 font-bold bg-zinc-50 dark:bg-zinc-900/60 p-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800/40 break-all select-all">
                {selectedCoin.address}
              </div>
            </div>

            <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold bg-amber-500/10 dark:bg-amber-500/[0.05] p-2.5 rounded-lg border border-amber-500/25">
              ⚠️ Remember to cover the transaction gas fees so the exact amount of ${amount} USD arrives.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
