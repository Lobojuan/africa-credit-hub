# Universal Credit Hub — Disaster Recovery Runbook

**Classification:** Confidential · **Owner:** Platform owner · **Review cadence:** after every drill and at least every six months

## What is true today

| Control | Current state | Evidence |
| --- | --- | --- |
| Application release | GitHub Actions verifies and deploys `main`; failed release checks roll back | GitHub Actions: `Deploy UCH production` |
| Service health | Release checks require the UCH process, PostgreSQL, and public HTTPS health route | `GET /api/health` |
| Server recovery | Hetzner server backups are enabled | Hetzner Console → server → Backups |
| Database backups | UCH creates compressed daily PostgreSQL dumps and verifies their SQL structure | Backup & Recovery screen / audit log |
| Browser restore | Disabled in production | UCH Backup & Recovery screen |
| Separate database copy | **Not configured until the Backup & Recovery screen says “Configured”.** | `BACKUP_S3_*` deployment configuration |

Do not represent UCH as having point-in-time recovery, read replicas, multi-region failover, immutable backups, or an RPO below the backup frequency until those controls are actually deployed and independently tested.

## Recovery objectives

Targets must be agreed with each bank before go-live. Until a successful restore drill and off-site database copy exist, UCH has **no verified RTO/RPO commitment**.

## Incident roles

| Role | Responsibility |
| --- | --- |
| Incident lead | Declares incident, sets customer/regulator communication cadence, authorises recovery decision |
| Database custodian | Takes a final evidence copy where possible; runs the staging restore drill |
| Platform operator | Restores the service host, deploys the approved release and verifies public health |
| Security lead | Preserves evidence, rotates exposed credentials, assesses breach notification obligations |

At least two people must approve a production data-recovery cutover: the incident lead and database custodian. No production restore is initiated from the UCH web UI.

## Recovery sequence

1. Declare the incident and record its start time, scope and incident lead.
2. Protect evidence. Do not delete logs, backups or affected disks.
3. Enable maintenance mode or take the application out of service as appropriate.
4. Identify the recovery point and verify the selected dump’s integrity in UCH.
5. Restore the selected dump to an isolated database whose name contains `restore`, `drill`, `staging`, `e2e`, or `test`.
6. Run [`scripts/verify-backup-restore.sh`](../scripts/verify-backup-restore.sh) against that isolated target. Record the output with the incident.
7. Validate authentication, consent records, audit-log continuity, country scoping, and representative credit-report queries in the isolated environment.
8. Only after two-person approval, perform the separately authorised production cutover using the same verified procedure.
9. Check `https://universalcredithub.com/api/health`, then conduct a post-incident review within 48 hours.

## Staging restore drill

The script deliberately refuses normal-looking production database names and refuses the current `DATABASE_URL` as a target.

```bash
scripts/verify-backup-restore.sh \
  /secure/path/to/uch_full_2026-07-28.sql.gz \
  'postgresql://restore_user:password@localhost:5432/uch_restore_drill'
```

It verifies the gzip archive, restores only to the named isolated database, and confirms PostgreSQL is queryable afterwards. It does not create a database, modify production, or prove a production cutover; the operator must still validate the restored data before any cutover.

## Evidence to retain for every drill

- Backup ID, creation time, checksum/integrity result and off-site shipment state
- Target database name (never a production URL or password)
- Script output and restore duration
- Sign-off from the incident lead and database custodian
- Validation results and corrective actions

## Missing controls before a bank production commitment

- Encrypted off-site database destination with independent retention
- Successful scheduled restore drills, with evidence
- Agreed RTO/RPO, on-call ownership and regulator/customer communication contacts
- Tested secret rotation and a documented break-glass procedure
