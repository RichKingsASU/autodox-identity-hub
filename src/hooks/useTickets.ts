import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export function useTickets() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const ticketsQuery = useQuery({
    queryKey: ["tickets", user?.id],
    queryFn: async (): Promise<Ticket[]> => {
      if (!user) return [];
      
      // Use type assertion since tickets table is new
      const { data, error } = await (supabase as any)
        .from("tickets")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data as Ticket[]) || [];
    },
    enabled: !!user,
  });

  const createTicketMutation = useMutation({
    mutationFn: async (ticket: {
      subject: string;
      description: string;
      priority: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await (supabase as any)
        .from("tickets")
        .insert({
          user_id: user.id,
          subject: ticket.subject,
          description: ticket.description,
          priority: ticket.priority,
        })
        .select()
        .single();

      if (error) throw error;
      return data as Ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", user?.id] });
    },
  });

  const updateTicketMutation = useMutation({
    mutationFn: async ({
      id,
      updates,
    }: {
      id: string;
      updates: Partial<Pick<Ticket, "status" | "priority">>;
    }) => {
      const { data, error } = await (supabase as any)
        .from("tickets")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data as Ticket;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets", user?.id] });
    },
  });

  return {
    tickets: ticketsQuery.data || [],
    isLoading: ticketsQuery.isLoading,
    error: ticketsQuery.error,
    createTicket: createTicketMutation.mutateAsync,
    isCreating: createTicketMutation.isPending,
    updateTicket: updateTicketMutation.mutateAsync,
    isUpdating: updateTicketMutation.isPending,
  };
}
