
# Grant Admin Access to All Three Accounts

## Current Status
| Email | User ID | Current Role |
|-------|---------|--------------|
| richard1king1@gmail.com | aff1e19d-b4eb-45b7-b932-ab556dbd9a34 | super_admin ✓ |
| richardking427@yahoo.com | ebccefa4-02f6-4d03-8938-49de9c76a56a | admin ✓ |
| freakinglasers1983@gmail.com | 4557f115-d219-4c8d-9cf9-938c2cb81c29 | **No role** |

## Action Required
Insert an admin role for `freakinglasers1983@gmail.com`:

```sql
INSERT INTO user_roles (user_id, role) 
VALUES ('4557f115-d219-4c8d-9cf9-938c2cb81c29', 'admin');
```

## Result
After this change, all three accounts will have admin access to the Admin Portal at `/admin/*`, including the Templates page where you can view and preview the new Koala Sign template.
