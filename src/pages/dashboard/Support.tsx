import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Plus, MessageSquare, Inbox } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { StatusPill } from "@/components/ui/StatusPill";
import { useTickets } from "@/hooks/useTickets";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const faqs = [
  {
    question: "How do I get started?",
    answer: "Complete your business verification application to unlock all features. Once approved, you can generate API keys and start processing verifications immediately.",
  },
  {
    question: "What is the review process?",
    answer: "Our team reviews each application to ensure compliance with our terms of service. We verify your business information and use case to maintain platform integrity.",
  },
  {
    question: "How long does verification take?",
    answer: "Most applications are reviewed within 1-2 business days. You'll receive an email notification once your account is approved.",
  },
  {
    question: "How do I contact support?",
    answer: "You can submit a ticket through this page or email us directly at support@autodox.com. Our support team typically responds within 24 hours.",
  },
];

export default function Support() {
  const { tickets, isLoading, createTicket, isCreating } = useTickets();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("normal");

  const handleSubmitTicket = async () => {
    if (!subject.trim() || !description.trim()) {
      toast({
        variant: "destructive",
        title: "Missing fields",
        description: "Please fill in all required fields.",
      });
      return;
    }

    try {
      await createTicket({ subject, description, priority });
      toast({
        title: "Ticket submitted",
        description: "We'll get back to you as soon as possible.",
      });
      setIsOpen(false);
      setSubject("");
      setDescription("");
      setPriority("normal");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Failed to submit ticket",
        description: "Please try again later.",
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-2xl font-bold text-foreground">Support Center</h1>
        <p className="text-muted-foreground">
          Get help with your account and find answers to common questions.
        </p>
      </div>

      {/* Top Row: Contact Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Email Support</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Reach out to our support team directly via email.
              </p>
              <Button variant="outline" asChild>
                <a href="mailto:support@autodox.com">support@autodox.com</a>
              </Button>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="h-6 w-6 text-success" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">Submit Ticket</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a support ticket and track its progress.
              </p>
              <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                  <Button className="btn-gradient text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    New Ticket
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-card border-border">
                  <DialogHeader>
                    <DialogTitle>Submit a Support Ticket</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Subject
                      </label>
                      <Input
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Brief description of your issue"
                        className="input-recessed"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Priority
                      </label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="input-recessed">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">
                        Description
                      </label>
                      <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe your issue in detail..."
                        rows={4}
                        className="input-recessed"
                      />
                    </div>
                    <Button
                      onClick={handleSubmitTicket}
                      disabled={isCreating}
                      className="w-full btn-gradient text-primary-foreground"
                    >
                      {isCreating ? "Submitting..." : "Submit Ticket"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* FAQ Accordion */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Frequently Asked Questions
        </h3>
        <Accordion type="single" collapsible className="space-y-2">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`faq-${index}`}
              className="border border-border rounded-xl px-4 data-[state=open]:bg-muted/30"
            >
              <AccordionTrigger className="text-foreground hover:no-underline py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </GlassCard>

      {/* Your Tickets */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Your Tickets</h3>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Inbox className="h-8 w-8 text-muted-foreground" />
            </div>
            <h4 className="font-medium text-foreground mb-1">No tickets yet</h4>
            <p className="text-sm text-muted-foreground max-w-sm">
              When you submit a support ticket, it will appear here so you can track its progress.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell>
                      <StatusPill status={ticket.status as "open" | "pending" | "resolved" | "in_progress"} />
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {ticket.priority}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(ticket.created_at), "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </GlassCard>
    </motion.div>
  );
}
