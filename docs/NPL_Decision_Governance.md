# NPL Decision Governance

## Control objective

UCH separates authority, execution and observation for material NPL actions. Restructuring, cure/re-age and write-off proposals require an identified maker and a different authorised checker. The workflow prevents an approval badge from being mistaken for a credit-account update or accounting posting.

## Lifecycle

1. **Pending:** the maker submits policy authority, evidence, rationale, effective date and any affected amount.
2. **Approved or rejected:** a different authorised checker records a mandatory rationale. Self-approval is rejected by the server.
3. **Execution recorded:** after approval, an operator other than the checker records the bank-side evidence reference and notes.
4. **Reconciliation outstanding:** UCH does not update the authoritative credit account, IFRS 9 stage, provision, interest-in-suspense balance or GL. Those changes must arrive through their controlled bank integrations and reconcile to the case ledger.

Every transition appends a protected `npl_case_events` row. The existing PostgreSQL trigger rejects updates and deletes to that chronology.

## Decision-specific controls

| Decision | Required control |
|---|---|
| Restructure | Policy/committee authority and evidence; optional affected amount cannot exceed exposure |
| Cure/re-age | No amount is accepted because approval cannot rewrite exposure; bank cure rules remain authoritative |
| Write-off | Positive proposed amount is mandatory and cannot exceed current case exposure |

Only one pending proposal of the same type is permitted per case. Rejected or completed history is retained.

## Production boundary

Migration `0031_npl_decision_governance.sql` is additive but must be backed up, reviewed and applied before deploying the related API/UI. Country-specific cure, re-age, restructuring, write-off, taxation and regulatory rules remain a bank and regulator acceptance requirement.
