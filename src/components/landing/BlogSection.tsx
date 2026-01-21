import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  categories: string[];
  gradient: string;
}

const blogPosts: BlogPost[] = [
  {
    id: "1",
    title: "The Future of AI Documentation",
    excerpt: "Exploring how generative models are rewriting the rulebook for enterprise knowledge bases.",
    date: "MARCH 12, 2024",
    categories: ["TECH", "FUTURE"],
    gradient: "from-violet-600 via-purple-600 to-fuchsia-600",
  },
  {
    id: "2",
    title: "Scaling with Obsidian UI",
    excerpt: "How we developed a tactile design language for maximalist enterprise software.",
    date: "FEB 28, 2024",
    categories: ["DESIGN"],
    gradient: "from-slate-700 via-slate-600 to-slate-500",
  },
  {
    id: "3",
    title: "Automating the Enterprise",
    excerpt: "Legacy systems vs. the new wave of AI-powered SaaS integrations.",
    date: "JAN 15, 2024",
    categories: ["ENGINEERING"],
    gradient: "from-rose-600 via-pink-600 to-fuchsia-600",
  },
];

export function BlogSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(blogPosts.length - 1, prev + 1));
  };

  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-4 block">
              Insights
            </span>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground">
              Latest from the blog
            </h2>
          </div>

          {/* Navigation Arrows */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="h-10 w-10 rounded-xl border-border hover:bg-secondary disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentIndex >= blogPosts.length - 1}
              className="h-10 w-10 rounded-xl border-border hover:bg-secondary disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogPosts.map((post, index) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <GlassCard className="h-full p-0 overflow-hidden hover:border-primary/30 transition-colors">
                {/* Image/Gradient Area */}
                <div className={`relative h-48 bg-gradient-to-br ${post.gradient} overflow-hidden`}>
                  {/* Abstract Pattern Overlay */}
                  <div className="absolute inset-0 opacity-30">
                    <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                      {post.id === "1" && (
                        <>
                          <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/20" />
                          <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-white/20" />
                          <circle cx="50" cy="50" r="20" fill="none" stroke="currentColor" strokeWidth="0.2" className="text-white/20" />
                        </>
                      )}
                      {post.id === "2" && (
                        <>
                          {[...Array(20)].map((_, i) => (
                            <line
                              key={i}
                              x1="0"
                              y1={i * 5}
                              x2="100"
                              y2={i * 5 + 10}
                              stroke="currentColor"
                              strokeWidth="0.3"
                              className="text-white/10"
                            />
                          ))}
                        </>
                      )}
                      {post.id === "3" && (
                        <>
                          {[...Array(30)].map((_, i) => (
                            <rect
                              key={i}
                              x={i * 3.5}
                              y={50 - Math.random() * 40}
                              width="2"
                              height={20 + Math.random() * 30}
                              fill="currentColor"
                              className="text-white/20"
                            />
                          ))}
                        </>
                      )}
                    </svg>
                  </div>

                  {/* Category Tags */}
                  <div className="absolute top-4 left-4 flex gap-2">
                    {post.categories.map((category) => (
                      <span
                        key={category}
                        className="px-2.5 py-1 rounded-md text-[10px] font-semibold uppercase tracking-wide bg-black/40 text-white backdrop-blur-sm"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground tracking-wide">
                      {post.date}
                    </span>
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                      <ArrowUpRight className="h-4 w-4 text-primary group-hover:text-primary-foreground transition-colors" />
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
