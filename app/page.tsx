"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, CheckCircle, DollarSign, Users } from "lucide-react";
export default function LandingPage() {
  const [email, setEmail] = useState("");

  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 3 },
  };

  const stagger = {
    animate: {
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  return (
    <div className="flex flex-col min-h-screen ">
      <main className="flex-1">
        <section className="w-full h-svh pb-12 md:py-24 lg:pb-32 xl:pb-48 bg-gradient-to-b from-white to-gray-400 dark:from-transparent dark:via-transparent dark:to-primary/20">
          <motion.div
            className="container px-4 md:px-6 items-center flex flex-col justify-center h-full"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.h1
              className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none"
              variants={fadeIn}
            >
              Simplify Your Financial Management
            </motion.h1>
            <motion.p
              className="max-w-[600px] text-gray-600 md:text-xl dark:text-gray-400 mt-4"
              variants={fadeIn}
            >
              Deposily helps organizations streamline payments, manage payers,
              and gain financial insights with ease.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 mt-8"
              variants={fadeIn}
            >
              <Button size="lg" asChild>
                <Link href="/signup">
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#demo">Watch Demo</Link>
              </Button>
            </motion.div>
          </motion.div>
        </section>
        <section
          id="features"
          className="w-full py-12 md:py-24 lg:py-32 bg-background h-svh items-center flex flex-col justify-center"
        >
          <motion.div
            className="container px-4 md:px-6 flex flex-col h-full relative items-center justify-center"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.h2
              className="text-3xl self-start absolute top-0 font-bold tracking-tighter sm:text-4xl md:text-5xl"
              variants={fadeIn}
            >
              Key Features
            </motion.h2>
            <motion.div
              className="grid gap-10 sm:grid-cols-2 md:grid-cols-3 mt-8"
              variants={stagger}
            >
              <motion.div
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <DollarSign className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold">Effortless Payments</h3>
                <p className="text-gray-500 mt-2">
                  Process and track payments with ease
                </p>
              </motion.div>
              <motion.div
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <Users className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold">Payer Management</h3>
                <p className="text-gray-500 mt-2">
                  Organize and manage your payers efficiently
                </p>
              </motion.div>
              <motion.div
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <CheckCircle className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-xl font-bold">Automated Reconciliation</h3>
                <p className="text-gray-500 mt-2">
                  Reconcile statements automatically
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>
        <section
          id="cta"
          className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground"
        >
          <motion.div
            className="container px-4 md:px-6"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.h2
              className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl"
              variants={fadeIn}
            >
              Ready to Streamline Your Finances?
            </motion.h2>
            <motion.p
              className="max-w-[600px] text-primary-foreground md:text-xl mt-4"
              variants={fadeIn}
            >
              Join thousands of organizations already using Deposily to manage
              their finances more effectively.
            </motion.p>
            <motion.div
              className="flex flex-col sm:flex-row gap-4 mt-8"
              variants={fadeIn}
            >
              <Input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="max-w-sm"
              />
              <Button size="lg" variant="secondary">
                Start Free Trial
              </Button>
            </motion.div>
          </motion.div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500">
          © 2024 Deposily. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
