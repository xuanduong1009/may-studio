import { Camera, Heart } from "lucide-react";
import Image from "next/image";
import { site } from "@/lib/site";

type Shot = { src: string; w: number; h: number; likes: number };

/** Masonry wall of editorial shots, styled like the brand's social feed. */
export function GalleryWall({ shots, title, sub, cta }: { shots: Shot[]; title: string; sub: string; cta: string }) {
  return (
    <section className="container-x py-24">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm text-muted">
            <Camera size={16} /> @may.studio
          </p>
          <h2 className="font-display text-4xl sm:text-5xl">{title}</h2>
          <p className="mt-2 max-w-md text-muted">{sub}</p>
        </div>
        <a href={site.socials.instagram} target="_blank" rel="noreferrer" className="rounded-full border border-border px-5 py-2.5 text-sm hover:border-foreground">
          {cta}
        </a>
      </div>
      <div className="columns-2 gap-3 sm:columns-3 sm:gap-4 lg:columns-4">
        {shots.map((s) => (
          <figure key={s.src} className="group relative mb-3 break-inside-avoid overflow-hidden rounded-2xl sm:mb-4" data-cursor="♥">
            <Image
              src={s.src}
              alt=""
              width={s.w}
              height={s.h}
              sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
              className="h-auto w-full transition-transform duration-[1.2s] ease-out-expo group-hover:scale-[1.06]"
            />
            <figcaption className="absolute inset-0 flex items-end bg-gradient-to-t from-black/50 to-transparent p-4 text-sm text-white opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <span className="flex items-center gap-1.5">
                <Heart size={14} className="fill-white" /> {s.likes.toLocaleString("vi-VN")}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
