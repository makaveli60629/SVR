# Stripe hookup notes

Keep Stripe secret keys on the server only.

Suggested flow:
1. Front end button calls `/api/create-checkout-session`.
2. Server creates a Checkout Session using your secret key.
3. Client redirects to the returned `url`.
4. Stripe webhook updates your SQL tables.

Store in SQL:
- user_id
- stripe_customer_id
- stripe_subscription_id
- membership_tier
- status
- current_period_end
