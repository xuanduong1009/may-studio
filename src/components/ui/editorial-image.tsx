"use client";

import { motion, useScroll, useTransform } from "motion/react";
import Image from "next/image";
import { useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * A photo that is revealed with a curtain wipe when it enters the viewport,
 * settles from a slight zoom, and (optionally) drifts with scroll for depth.
 * Only transform/opacity are animated continuously, which stay on the GPU.
 */
export function EditorialImage({
  src,
  alt,
  sizes,
  className,
  imageClassName,
  priority,
  parallax = 0,
  reveal = true,
}: {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  /** 0 = none; 0.1 = image travels ±10% of its height while crossing the screen */
  parallax?: number;
  reveal?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [`${-parallax * 100}%`, `${parallax * 100}%`]);

  return (
    <motion.div
      ref={ref}
      className={cn("relative overflow-hidden bg-subtle", className)}
      initial={reveal ? { clipPath: "inset(100% 0% 0% 0%)" } : false}
      whileInView={reveal ? { clipPath: "inset(0% 0% 0% 0%)" } : undefined}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 1.1, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.div
        className="absolute inset-x-0"
        style={{ y: parallax ? y : 0, top: `${-parallax * 100}%`, bottom: `${-parallax * 100}%` }}
        initial={reveal ? { scale: 1.18 } : false}
        whileInView={reveal ? { scale: 1 } : undefined}
        viewport={{ once: true, margin: "0px 0px -10% 0px" }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={cn("object-cover", imageClassName)} />
      </motion.div>
    </motion.div>
  );
}
