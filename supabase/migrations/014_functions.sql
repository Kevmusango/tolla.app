-- Function to handle profile creation on Auth Sign Up
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger mapping handle_new_auth_user
CREATE OR REPLACE TRIGGER trg_on_auth_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Function to log event on reward transaction insert
CREATE OR REPLACE FUNCTION public.handle_new_transaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.tolla_events (type, business_id, location_id, user_id, metadata)
  VALUES (
    CASE 
      WHEN NEW.status = 'ACTIVE' THEN 'reward_earned'
      WHEN NEW.status = 'REDEEMED' THEN 'reward_redeemed'
      ELSE 'reward_adjustment'
    END,
    NEW.business_id,
    NEW.location_id,
    NEW.tolla_user_id,
    jsonb_build_object('transaction_id', NEW.id, 'source', NEW.source, 'value', NEW.reward_value)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger mapping handle_new_transaction
CREATE OR REPLACE TRIGGER trg_on_tx_created
  AFTER INSERT ON public.reward_transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_transaction();
