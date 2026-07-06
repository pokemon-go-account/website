import connectDB from "@/lib/db";
import Product from "@/models/Product";
import { RecoveryButtons } from "./recovery-buttons";
import { ShieldCheck, Activity, RefreshCw, KeyRound, ArrowRight, Star, HeartHandshake } from "lucide-react";
import { cn } from "@/lib/utils";

export const revalidate = 0; // Dynamic route

export default async function RecoveryPage() {
  await connectDB();

  // Fetch the recovery service product details
  let productDoc = await Product.findOne({ name: "Premium Pokémon GO Account Recovery Service" }).lean();
  
  // Fallback if seeding has not run or has different values
  const product = productDoc
    ? JSON.parse(JSON.stringify(productDoc))
    : {
        _id: "recovery-service-placeholder-id",
        name: "Premium Pokémon GO Account Recovery Service",
        price: 49.99,
        description: "Professional recovery and retrieval service for lost, banned, or compromised Pokémon GO accounts. 100% secure, manual review, and high success rate.",
        imageUrl: "/recovery-service.png",
      };

  const benefits = [
    {
      icon: ShieldCheck,
      title: "100% Secure & Confidential",
      desc: "All credentials are encrypted and stored in a secure offline vault. Once recovery is verified and your account is handed back, all session data and login history are permanently scrubbed.",
    },
    {
      icon: Activity,
      title: "95%+ Success Rate",
      desc: "Our dedicated security specialists utilize formal appeal procedures, coordinate logs analysis, and legal Niantic terms support to retrieve locked or hijacked Trainer profiles.",
    },
    {
      icon: RefreshCw,
      title: "Full Refund Guarantee",
      desc: "If our recovery team determines your account cannot be retrieved after all avenues are exhausted, we issue a 100% full refund on the spot. Zero risk to you.",
    },
    {
      icon: KeyRound,
      title: "Bypass Hard Locks",
      desc: "We assist with forgotten emails, deactivated PTC profiles, compromised Google/Facebook logins, and incorrect Niantic Kids account configurations.",
    },
  ];

  const steps = [
    {
      num: "01",
      title: "Place Your Order",
      desc: "Add the service to your storefront cart or click instant Telegram checkout to order directly.",
    },
    {
      num: "02",
      title: "Provide Account Context",
      desc: "Work with our support specialist to supply the username, creation details, last known device, and transaction receipts.",
    },
    {
      num: "03",
      title: "Diagnosis & Appeal",
      desc: "Our experts run diagnostics to identify locks or suspension reasons and compile a custom verification appeal.",
    },
    {
      num: "04",
      title: "Secure Restoration",
      desc: "We perform coordinate overrides, secure the login links, and hand over a clean, fully-accessible account.",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      
      {/* Upper Hero Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border-b border-zinc-200 dark:border-white/[0.05] pb-10">
        
        {/* Left Side: Text Details */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="inline-flex items-center gap-1.5 bg-[#24A1DE]/10 border border-[#24A1DE]/20 text-[#24A1DE] px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
            <HeartHandshake className="h-3.5 w-3.5 animate-pulse" />
            Trainer Support Desk
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground bg-gradient-to-r from-neutral-900 via-neutral-700 to-neutral-500 dark:from-white dark:via-neutral-200 dark:to-neutral-400 bg-clip-text text-transparent leading-none">
              Pokémon GO Account Recovery Service
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Professional, highly confidential, and guaranteed retrieval for locked, banned, or compromised Pokémon GO accounts. Don't lose years of progression, rare shiny metrics, and hard-earned badges. Let our recovery specialists retrieve your main profile.
            </p>
          </div>

          {/* Pricing & Checkout card */}
          <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-white/[0.06] rounded-2xl p-6 space-y-4 max-w-md">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/[0.05] pb-3">
              <div>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-semibold">Service Fee</span>
                <div className="text-2xl font-black text-zinc-900 dark:text-white mt-0.5">
                  ${product.price.toLocaleString()}
                </div>
              </div>
              <div className="flex flex-col items-end text-right">
                <div className="flex items-center gap-1">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-3 w-3 fill-yellow-400 stroke-yellow-400" />
                  ))}
                </div>
                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold mt-1">4.9/5 Trainer Satisfaction</span>
              </div>
            </div>

            <RecoveryButtons product={product} />

            <div className="flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold pt-1">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
              <span>Protected by Secure Escrow Appeals Vault</span>
            </div>
          </div>
        </div>

        {/* Right Side: Graphic Banner Image */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="relative group rounded-3xl border border-zinc-200/80 dark:border-white/[0.06] overflow-hidden bg-zinc-100 dark:bg-zinc-950/60 p-2 shadow-2xl max-w-md w-full">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-auto object-cover rounded-2xl group-hover:scale-[1.01] transition-transform duration-500"
            />
            {/* Holographic light overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-purple-500/5 pointer-events-none" />
          </div>
        </div>

      </div>

      {/* Benefits grid */}
      <div className="space-y-6">
        <h2 className="text-xl font-extrabold text-foreground tracking-tight border-l-4 border-cyan-400 pl-3">
          Why Trainers Trust Our Support Service
        </h2>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="rounded-2xl border border-zinc-200/60 dark:border-white/[0.03] bg-white/40 dark:bg-white/[0.005] p-5 hover:border-zinc-300 dark:hover:border-white/[0.06] transition-all space-y-3"
              >
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/10 flex items-center justify-center">
                  <Icon className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold text-zinc-900 dark:text-white tracking-tight">{benefit.title}</h3>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">{benefit.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step by step recovery workflow */}
      <div className="rounded-3xl border border-zinc-200/60 dark:border-white/[0.04] bg-zinc-50/50 dark:bg-white/[0.005] p-8 space-y-8">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-foreground uppercase tracking-wider">How The Recovery Workflow Works</h2>
          <p className="text-xs text-muted-foreground">
            A step-by-step breakdown of how our recovery team escalates and retrieves your Trainer account.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={index} className="relative space-y-3">
              <div className="text-3xl font-black bg-gradient-to-b from-cyan-400 to-transparent bg-clip-text text-transparent leading-none">
                {step.num}
              </div>
              <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{step.title}</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">{step.desc}</p>
              {index < 3 && (
                <div className="hidden lg:block absolute top-4 right-[-15px] text-zinc-300 dark:text-zinc-800">
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
