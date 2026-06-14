-- Add user_email column to support_tickets table
ALTER TABLE support_tickets 
ADD COLUMN user_email text NOT NULL DEFAULT '';

-- Remove the default after adding the column
ALTER TABLE support_tickets 
ALTER COLUMN user_email DROP DEFAULT;

-- Add index for email lookups
CREATE INDEX idx_support_tickets_email ON support_tickets(user_email);

-- Add helpful comment
COMMENT ON COLUMN support_tickets.user_email IS 'Email address of the user who created the ticket';