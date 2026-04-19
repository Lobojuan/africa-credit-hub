# CI Failure Notifications

Both CI workflows send an alert whenever a test run fails. You can configure
**Slack**, **email**, or both. If neither channel is configured the failure is
still visible in the GitHub Actions UI, but no proactive alert is sent.

| Workflow | Alert scope |
|---|---|
| Playwright Full Test Suite (`playwright-all-tests.yml`) | Any branch (push or pull-request) |
| Tracing & Collections Tests (`tracing-collections-tests.yml`) | `main` branch only |

---

## Slack (primary channel)

Set a single repository secret:

| Secret | Value |
|---|---|
| `SLACK_WEBHOOK_URL` | Incoming-webhook URL for your target Slack channel |

When this secret is present the Slack alert fires automatically; when it is
absent the email fallback is used instead.

---

## Email fallback (used when Slack is not configured)

If `SLACK_WEBHOOK_URL` is **not** set, the workflows will send a plain-text
failure email via SMTP. **All five secrets below must be set** for the email
step to activate — if any required secret is missing the step is skipped
silently rather than failing the workflow. Add the following repository secrets:

| Secret | Required | Description |
|---|---|---|
| `ALERT_EMAIL_TO` | Yes | Recipient address (or comma-separated list) |
| `SMTP_SERVER` | Yes | SMTP host, e.g. `smtp.gmail.com` |
| `SMTP_PORT` | No | SMTP port (defaults to `587`) |
| `SMTP_USERNAME` | Yes | Login username / sender address |
| `SMTP_PASSWORD` | Yes | Login password or app-specific password |

> **Gmail tip:** enable 2-step verification on the sending account and create
> an [App Password](https://myaccount.google.com/apppasswords) to use as
> `SMTP_PASSWORD`. Use `smtp.gmail.com` as `SMTP_SERVER` and `587` as
> `SMTP_PORT`.

### What the email contains

Every failure email includes:

- The name of the failing workflow / job
- The branch and commit that triggered the run
- A direct link to the failed GitHub Actions run

---

## Adding secrets to the repository

1. Open the repository on GitHub.
2. Go to **Settings → Secrets and variables → Actions**.
3. Click **New repository secret** and add each secret listed above.

Changes take effect on the next workflow run — no code change is needed.
