-- Add GIN index on searchVector for full-text search
CREATE INDEX "Conversation_searchVector_idx" ON "Conversation" USING GIN ("searchVector" tsvector_ops);

-- Create a function to update searchVector on Conversation changes
CREATE OR REPLACE FUNCTION update_conversation_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.searchVector := setweight(to_tsvector('english', NEW.title), 'A');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update searchVector on insert/update
CREATE TRIGGER trg_conversation_search_vector
  BEFORE INSERT OR UPDATE ON "Conversation"
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_search_vector();
