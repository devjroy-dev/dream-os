-- Seed: local test data
insert into users (phone, name) values ('+918757788550', 'Dev')
on conflict (phone) do nothing;

insert into vendors (user_id, business_name, category, city, founding_cohort)
select u.id, 'Dream OS Test', 'photography', 'Delhi', true
from users u where u.phone = '+918757788550'
on conflict do nothing;
