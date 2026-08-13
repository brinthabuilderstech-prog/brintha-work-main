# Security Specification for Brintha Builders Firestore

## 1. Data Invariants
1. `users`: Document IDs correspond to unique user IDs. Read access is allowed for authenticated users or system admins. Write access is restricted to authenticated users modifying their own profile or admins/supervisors managing personnel.
2. `attendance`: Each record is bound to a valid `workerId`, `date`, and `status`. Only supervisors and admins can mark or update attendance.
3. `advances`: Each record requires valid `workerId`, `amount > 0`, `date`, and `status`. Only supervisors and admins can create/update advances.
4. `payments`: Each record requires valid `workerId`, `amount > 0`, `date`, and `paymentMode`. Only admins and supervisors can create payments.
5. `settings`: Global system configuration readable by authenticated users and writable by admins.

## 2. Security Test Scenarios
- Unauthenticated read/write blocks on all collections.
- Malformed inputs (invalid schema, string sizes over limit) are rejected.
- Non-admin attempts to modify other user roles or site records are rejected.
