# Security Specification: SAPCYM Management Portal

## Data Invariants
1. A member's private data can only be read/written by the member themselves or an Admin.
2. Only Music Directors or Admins can upload or delete songs.
3. Only Admins or Executives can post/delete announcements and financial reports.
4. Attendance marking is restricted to Music Directors and Admins.
5. Historical attendance modification is exclusive to Admins.
6. Chat messages can be read and written by any authenticated member.
7. Role updates and member approvals can only be performed by Admins.

## The "Dirty Dozen" Payloads (Denial Tests)

1. **Identity Spoofing**: A non-admin user attempts to change their own role to 'Admin'.
2. **PII Leak**: A member attempts to read another member's private subcollection.
3. **Ghost Song**: A non-Music Director attempts to create a song document.
4. **Attendance Hijack**: A standard member attempts to mark attendance for a rehearsal.
5. **History Erasure**: A Music Director (not Admin) attempts to delete an attendance record from last month.
6. **Financial Espionage**: A standard member attempts to read the `financial_reports` collection.
7. **Broadcast Hijack**: A standard member attempts to create an announcement.
8. **Shadow Approval**: A pending member attempts to set their own `pendingApproval` status to `false`.
9. **Malicious ID Injection**: Attempt to create a document with a 1.5KB string as an ID.
10. **Resource Exhaustion**: Attempt to upload a chat message with a 1MB string content.
11. **Timestamp Forgery**: Attempt to create an announcement with a future timestamp (not `request.time`).
12. **Orphaned Reply**: Attempt to reply to a chat message ID that does not exist (requires `exists()` check).

## The Test Runner (firestore.rules.test.ts)
(This will be implemented using the `@firebase/rules-unit-testing` or similar if I were in a full testing environment, but here I will focus on the rules implementation and static validation via ESLint).
