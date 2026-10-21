-- V11: Make contract_id nullable on payment_transaction for non-contract payments (Connects topup, Pro subscription)
ALTER TABLE payment_transaction ALTER COLUMN contract_id DROP NOT NULL;
