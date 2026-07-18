"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Genmoji } from "@/components/home/genmoji";
import { AnimatedHeader } from "@/components/home/animated-section";
import aboutData from "@/data/about.json";

interface Role {
  title: string;
  period: string;
  bullets: string[];
}

interface Company {
  name: string;
  role: string;
  emoji: string;
  accent: string;
  period: string;
  location?: string;
  blurb?: string;
  bullets?: string[];
  subroles?: Role[];
}

const accentMap: Record<string, string> = {
  IBM: "text-glucose-blue",
  "Bauer Media": "text-glucose-purple",
  BBC: "text-glucose-green",
};

const honorAccentMap: Record<string, string> = {
  "MCA Awards — Rising Star": "text-glucose-yellow",
  "Radio Academy 30 under 30": "text-glucose-orange",
};

const { profile, experience, skills, certifications, honors, education } = aboutData;

const companies: Company[] = experience.map((e) => ({
  ...e,
  accent: accentMap[e.name] ?? "text-primary",
}));


export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-6 pt-28 pb-16 space-y-20">
      {/* Hero */}
      <section className="relative">
        <motion.div
          className="flex items-center gap-3 mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-2 h-2 rounded-full bg-glucose-green animate-pulse" />
          <span className="text-xs font-mono text-muted-foreground uppercase tracking-widest">
            About · Lead Software Engineer
          </span>
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <span className="text-foreground/90">Hi, I&apos;m </span>
          <span className="gradient-text">Hannah</span>
        </motion.h1>

        <motion.div
          className="flex flex-wrap gap-3 mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          {profile.badges.map((badge) => (
            <Badge key={badge} variant="outline" className="gap-2 px-3 py-1.5 bg-card/50 border-border/50">
              {badge}
            </Badge>
          ))}
        </motion.div>

        <motion.div
          className="grid md:grid-cols-[1.4fr_1fr] gap-8 items-start"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
            {profile.bio.map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>

          <Card className="bg-card/50 border-border/50">
            <CardContent className="p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
                Quick facts
              </p>
              <div className="space-y-3 text-sm">
                <FactRow emoji="🏢" label="Currently" value={profile.quickFacts.currently} />
                <FactRow emoji="📅" label="Years in tech" value={profile.quickFacts.yearsInTech} />
                <FactRow emoji="🛠️" label="Last shipped" value={profile.quickFacts.lastShipped} />
                <FactRow emoji="🎢" label="T1D since" value={profile.quickFacts.t1dSince} />
                <FactRow emoji="📜" label="Certifications" value={profile.quickFacts.certifications} />
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a
                    href={profile.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Genmoji emoji="💼" size="sm" interactive={false} />
                    LinkedIn
                  </a>
                </Button>
                <Button asChild size="sm" variant="outline" className="gap-1.5">
                  <a href={`mailto:${profile.email}`}>
                    <Genmoji emoji="✉️" size="sm" interactive={false} />
                    Email
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </section>

      {/* Experience */}
      <section>
        <AnimatedHeader emoji="🧭" title="Experience" />
        <div className="space-y-6">
          {companies.map((company, i) => (
            <motion.div
              key={company.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
            >
              <Card className="bg-card/50 border-border/50 card-interactive hover:border-border">
                <CardContent className="p-6">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <Genmoji emoji={company.emoji} size="lg" />
                      <div>
                        <h3 className={`text-xl font-bold ${company.accent}`}>
                          {company.name}
                        </h3>
                        <p className="text-xs font-mono text-muted-foreground mt-0.5">
                          {company.role}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-mono text-foreground/80">{company.period}</div>
                      {company.location && (
                        <div className="text-[10px] font-mono text-muted-foreground mt-0.5">
                          {company.location}
                        </div>
                      )}
                    </div>
                  </div>

                  {company.blurb && (
                    <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                      {company.blurb}
                    </p>
                  )}

                  {company.bullets && (
                    <ul className="space-y-1.5 text-sm text-foreground/85">
                      {company.bullets.map((b, j) => (
                        <li key={j} className="flex gap-2">
                          <span className={`mt-1 inline-block w-1 h-1 rounded-full ${company.accent} bg-current shrink-0`} />
                          <span className="leading-relaxed">{b}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {company.subroles && (
                    <div className="mt-2 space-y-4">
                      {company.subroles.map((sub) => (
                        <div
                          key={sub.title}
                          className="pl-4 border-l border-border/60"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1.5">
                            <p className="text-sm font-semibold text-foreground">
                              {sub.title}
                            </p>
                            <p className="text-[10px] font-mono text-muted-foreground">
                              {sub.period}
                            </p>
                          </div>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {sub.bullets.map((b, j) => (
                              <li key={j} className="flex gap-2">
                                <span className={`mt-1.5 inline-block w-1 h-1 rounded-full ${company.accent} bg-current shrink-0`} />
                                <span className="leading-relaxed">{b}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section>
        <AnimatedHeader emoji="🛠️" title="Skills & Tooling" />
        <motion.div
          className="flex flex-wrap gap-2"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          {skills.map((skill, i) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
            >
              <Badge
                variant="secondary"
                className="font-mono text-sm px-3 py-1.5 bg-secondary/50 hover:bg-secondary transition-colors cursor-default"
              >
                <span className="mr-1.5">{skill.emoji}</span>
                {skill.name}
              </Badge>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* Certifications & Honors */}
      <section>
        <AnimatedHeader emoji="🏅" title="Certifications & Honors" />
        <div className="grid md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-card/50 border-border/50 h-full">
              <CardContent className="p-5">
                <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-4">
                  Certifications
                </p>
                <ul className="space-y-2.5">
                  {certifications.map((c) => (
                    <li key={c.name} className="flex items-center gap-3 text-sm">
                      <span className="text-lg">{c.emoji}</span>
                      <span className="text-foreground/90">{c.name}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4"
          >
            {honors.map((h) => (
              <Card key={h.title} className="bg-card/50 border-border/50 card-interactive">
                <CardContent className="p-5 flex items-center gap-4">
                  <Genmoji emoji={h.emoji} size="lg" />
                  <div>
                    <div className={`text-base font-bold ${honorAccentMap[h.title] ?? "text-primary"}`}>{h.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{h.sub}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Education */}
      <section>
        <AnimatedHeader emoji="🎓" title="Education" />
        <div className="grid md:grid-cols-2 gap-5">
          {education.map((e, i) => (
            <motion.div
              key={e.school}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Card className="bg-card/50 border-border/50 card-interactive h-full">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3 mb-2">
                    <Genmoji emoji={e.emoji} size="lg" />
                    <div>
                      <h3 className="text-base font-semibold text-foreground">
                        {e.school}
                      </h3>
                      <p className="text-xs font-mono text-muted-foreground mt-1">
                        {e.period}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {e.degree}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

function FactRow({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-2 text-muted-foreground">
        <span>{emoji}</span>
        <span className="text-xs font-mono uppercase tracking-wider">{label}</span>
      </span>
      <span className="text-foreground/90 text-right">{value}</span>
    </div>
  );
}
