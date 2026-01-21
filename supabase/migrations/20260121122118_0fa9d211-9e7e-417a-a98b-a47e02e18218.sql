-- Create contact_submissions table for storing contact form data
CREATE TABLE public.contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  company text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  responded_at timestamp with time zone
);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit contact form (public form)
CREATE POLICY "Anyone can submit contact form"
ON public.contact_submissions
FOR INSERT
WITH CHECK (true);

-- Only admins can view contact submissions
CREATE POLICY "Admins can view contact submissions"
ON public.contact_submissions
FOR SELECT
USING (public.is_admin(auth.uid()));

-- Only admins can update contact submissions (mark as responded)
CREATE POLICY "Admins can update contact submissions"
ON public.contact_submissions
FOR UPDATE
USING (public.is_admin(auth.uid()));