# GroupGuard — Bot specification

**Archetype:** community

**Voice:** professional and concise — write every user-facing message, button label, error, and empty state in this voice.

GroupGuard is a Telegram bot that automates spam and bot protection for group owners. It verifies new members with a configurable CAPTCHA-style math question, auto-removes unverified users after a timeout, detects common spam patterns, and provides admin commands for moderation. The bot maintains a short action log and offers periodic overview stats while keeping trusted members exempt from automated actions.

> This is the complete contract for the bot. Implement EVERY entry point, flow, feature, integration, and edge case below. The completeness review checks the bot against this document after each build pass.

## Primary audience

- Telegram group owners
- Telegram group admins

## Success criteria

- Automated removal of unverified members after timeout
- Effective spam pattern detection and escalation
- Admin commands for moderation actions with logging
- Periodic overview stats for group owners

## Entry points

Every feature must be reachable from the bot's command/button surface (button-first; only /start and /help are slash commands).

- **/start** (command, actor: user, command: /start) — Open the main menu
- **Verify** (button, actor: user, callback: verify:start) — Initiates verification process for new members
  - inputs: math question answer
  - outputs: verification status
- **/warn** (command, actor: admin, command: /warn) — Warn a user for violating group rules
  - inputs: @username, reason
  - outputs: moderation action log
- **/mute** (command, actor: admin, command: /mute) — Mute a user for a specified duration
  - inputs: @username, duration
  - outputs: moderation action log
- **/kick** (command, actor: admin, command: /kick) — Kick a user from the group
  - inputs: @username
  - outputs: moderation action log
- **/ban** (command, actor: admin, command: /ban) — Ban a user from the group
  - inputs: @username
  - outputs: moderation action log
- **/trust** (command, actor: admin, command: /trust) — Mark a user as trusted (exempt from auto actions)
  - inputs: @username
  - outputs: member record update
- **/untrust** (command, actor: admin, command: /untrust) — Remove a user's trusted status
  - inputs: @username
  - outputs: member record update
- **/setwelcome** (command, actor: admin, command: /setwelcome) — Set the welcome message for new members
  - inputs: custom welcome text
  - outputs: group settings update
- **/setrules** (command, actor: admin, command: /setrules) — Set the group rules message
  - inputs: custom rules text
  - outputs: group settings update
- **/setpolicy** (command, actor: admin, command: /setpolicy) — Configure spam detection thresholds and verification timeout
  - inputs: policy parameters
  - outputs: group settings update
- **/log** (command, actor: admin, command: /log) — View the moderation action log
  - outputs: action log summary
- **/stats** (command, actor: admin, command: /stats) — View periodic overview stats
  - inputs: time range
  - outputs: stat summary

## Flows

### New Member Verification
_Trigger:_ new member join

1. Send welcome message with rules and verification button
2. Present math question via button or private reply
3. Wait for verification within timeout
4. Verify answer and grant posting permissions
5. On failure, allow retries up to limit, then remove

_Data touched:_ member record, verification challenge

### Spam Detection and Escalation
_Trigger:_ message posted

1. Check for spam patterns (links from new accounts, repeated messages, rapid bursts)
2. If threshold met, issue warning
3. If repeated violations, mute user
4. If further violations, kick or ban user
5. Record all actions in log

_Data touched:_ member record, moderation action

### Admin Moderation Actions
_Trigger:_ /warn, /mute, /kick, /ban, /trust, /untrust

1. Process command parameters
2. Apply action to target user
3. Record action in log
4. Post explanation to group or admin chat

_Data touched:_ member record, moderation action

### Log and Stats Management
_Trigger:_ /log, /stats

1. Retrieve relevant log entries or stats
2. Format summary for display
3. Send to requesting admin

_Data touched:_ moderation action, group settings

## Data entities

Durable data (must survive a restart) uses the toolkit's persistent store, never in-memory maps.

- **Member Record** _(retention: persistent)_ — Tracks user information and status
  - fields: id, username, join time, trust flag, verification status
- **Verification Challenge** _(retention: session)_ — Stores verification questions and answers
  - fields: question, answer, issued time
- **Moderation Action** _(retention: persistent)_ — Records moderation events
  - fields: type, target, actor, reason, timestamp
- **Group Settings** _(retention: persistent)_ — Configurable bot parameters
  - fields: welcome text, rules, verification timeout, spam thresholds, trusted users list

## Integrations

- **Telegram** (required) — Bot API messaging
Call external APIs against their real contract (correct endpoints, ids, params); credentials from env. Do not fake responses.

## Owner controls

- Configure welcome message and rules
- Set verification timeout and spam thresholds
- Manage trusted users list
- View and manage moderation action logs
- Generate periodic stats reports

## Notifications

- Admin-only log chat updates
- Real-time admin alerts for removals or flood events (configurable)

## Permissions & privacy

- Only admins can access moderation commands and logs
- Trusted users are exempt from auto actions
- Unverified users are removed quietly by default
- Action logs are truncated after 90 days by default

## Edge cases

- Multiple verification attempts within timeout
- Admins or pinned messages being targeted by auto actions
- Spam patterns that bypass thresholds
- Trusted users violating rules

## Required tests

- Verify new member verification flow with timeout handling
- Test spam detection escalation path (warn → mute → kick → ban)
- Validate admin command execution and logging
- Confirm log truncation and stats generation

## Assumptions

- Verification method is simple math question
- Default verification timeout is 3 minutes
- Default spam thresholds are 48h for new accounts, 3 copies in 60s for repeats, 5 messages in 10s for floods
- Default escalation path is warn → 1h mute → kick → ban
- Trusted users are exempt from auto actions
- Notifications are logged to admin-only chat by default
- Action logs are retained for 90 days by default
