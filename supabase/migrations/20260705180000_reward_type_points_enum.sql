-- Must be separate migration: PostgreSQL cannot use new enum value in same transaction
ALTER TYPE public.reward_type ADD VALUE IF NOT EXISTS 'points';
