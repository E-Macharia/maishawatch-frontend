"use client";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
export function Reveal({ children, delay = 0, className = "" }: { children: ReactNode; delay?: number; className?: string }) { return <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }} className={className}>{children}</motion.div>; }
export function Lift({ children, className = "" }: { children: ReactNode; className?: string }) { return <motion.div whileHover={{ y: -3 }} transition={{ duration: 0.2 }} className={className}>{children}</motion.div>; }
