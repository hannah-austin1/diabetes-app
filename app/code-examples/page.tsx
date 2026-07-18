"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TabCarousel, type Tab } from "@/components/ui/tab-carousel";
import { SectionHeader } from "@/components/shared/section-header";
import content from "@/data/code-examples.json";

const { header, examples } = content;

export default function CodeExamplesPage() {
  const tabs: Tab[] = examples.map((example) => ({
    id: example.id,
    label: example.label,
    emoji: example.emoji,
    content: <ExamplePanel example={example as ExampleData} />,
  }));

  return (
    <div className="max-w-6xl mx-auto px-6 pt-28 pb-16">
      <SectionHeader
        statusColor={header.statusColor}
        statusLabel={header.statusLabel}
        title={header.title}
        description={header.description}
      />

      <TabCarousel tabs={tabs} />
    </div>
  );
}

interface ExampleData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  media: { type: "image" | "video"; src: string; alt: string }[];
}

function ExamplePanel({ example }: { example: ExampleData }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Description */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold text-foreground mb-3">{example.title}</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            {example.description}
          </p>
          <div className="flex flex-wrap gap-2">
            {example.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="font-mono text-xs bg-secondary/50"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Media area */}
      {example.media.length > 0 ? (
        <div className="grid gap-4">
          {example.media.map((item, i) => (
            <Card key={i} className="overflow-hidden bg-card/50 border-border/50">
              <CardContent className="p-0 flex items-center justify-center">
                {item.type === "image" ? (
                  <Image
                    src={item.src}
                    alt={item.alt}
                    width={1200}
                    height={675}
                    className="w-auto h-auto max-h-[80vh] object-contain rounded-lg"
                    unoptimized={item.src.endsWith(".gif")}
                  />
                ) : (
                  <VideoPlayer src={item.src} />
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 border-border/50 bg-card/30">
          <CardContent className="p-12 text-center">
            <div className="text-4xl mb-3">📸</div>
            <p className="text-muted-foreground text-sm">
              Screenshots and videos coming soon
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function VideoPlayer({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  function toggle() {
    const v = ref.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="relative cursor-pointer group" onClick={toggle}>
      <video
        ref={ref}
        src={src}
        className="w-full h-auto rounded-lg"
        playsInline
        onEnded={() => setPlaying(false)}
      >
        <track kind="captions" />
      </video>

      {/* Centred play / pause overlay */}
      <AnimatePresence>
        {!playing && (
          <motion.div
            className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="white"
                className="ml-1"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
