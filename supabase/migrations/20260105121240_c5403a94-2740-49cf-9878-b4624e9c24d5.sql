-- Activer le realtime pour la table clients
ALTER TABLE public.clients REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.clients;