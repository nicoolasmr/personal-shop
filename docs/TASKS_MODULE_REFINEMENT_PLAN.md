# TASKS MODULE REFINEMENT & NOTIFICATIONS PLAN
**Date:** 2025-12-31
**Status:** PLANNED

## 1. Critical Bug Fixes (Immediate Action)

### A. Task Details Dialog
- [ ] **Close Button Malfunction:** The "Close" (and 'X') button in `TaskDetailsDialog` is not clearing the selection state properly, causing the modal to stay stuck.
    - *Fix:* Ensure `onOpenChange(false)` correctly triggers the parent's `setSelectedTaskId(null)`.
- [ ] **Subtask Creation UI Latency:** Adding a subtask successfully saves to DB but does not immediately appear in the list (requires refresh).
    - *Fix:* Implement optimistic update or forced query invalidation (`queryClient.invalidateQueries`) specifically for the subtasks key.
- [ ] **Attachment Preview Empty:** The attachment modal opens but displays blank content for images/files.
    - *Fix:* Verify `getAttachmentUrl` logic (signed vs public URLs) and handle file type rendering fallback correctly.

### B. Tasks Page UI
- [ ] **Total Tasks Count Layout:** The "Total Tarefas" card has overlapping text/numbers ("Tarefas12") in the UI.
    - *Fix:* Adjust CSS Flexbox/Grid layout in `TasksPage.tsx` metrics cards to ensure proper spacing between label and count.

### C. Finance Module
- [ ] **Transaction Categories Dropdown Blank:** When opening the "New Transaction" modal, the categories dropdown is visually broken or empty, preventing selection.
    - *Fix:* Investigate `useTransactionCategories` hook and the Select component rendering in `CreateTransactionDialog`. Ensure categories are loaded and the Select content has proper height/z-index.
- [ ] **Transaction Creation Error (Date Null):** Creating a transaction fails with `null value in column "date" ... violates not-null constraint`.
    - *Fix:* The payload sent to Supabase is likely using `transaction_date` (frontend) but the DB expects `date` (or vice-versa), or the date field is completely missing in the payload mapping. Check `createTransaction` service and `CreateTransactionDialog` form submission.
- [ ] **Goal Progress Input Missing:** The "Financial Goal Details" modal displays current progress but lacks a direct input or button to "Add Progress" (deposit/withdrawal) specific to that goal.
    - *Fix:* Add a "+" button or an "Update Balance" section in the goal details modal to allow users to easily increment the `current_amount`.
- [ ] **Goal Edit Button Broken & Incorrect Mode:** Clicking "Edit" in the goal modal does nothing. Furthermore, it should open an **Edit** mode populated with existing data, not a blank "Create" mode.
    - *Fix:* Wire up the "Edit" button to switch the modal state to an editing view. Ensure the form is pre-filled with the goal's current data (target, name, date) and that the submit action updates (`UPDATE`) instead of creating (`INSERT`).

### D. Navigation & Routing
- [ ] **Broken Sidebar Links (Admin/WhatsApp):** Clicking "ADM" or "WhatsApp" in the sidebar redirects to Home instead of `/app/admin` or `/app/whatsapp`.
    - *Fix:* Verify `Sidebar.tsx` usage of `<Link>` or `useNavigate`. Ensure the paths are correct and not empty strings or `#`.

### E. Mobile Responsiveness (High Priority)
- [ ] **Sidebar Overlay Issue:** On mobile, the sidebar (when toggled) overlaps content poorly or does not close when interacting with the page.
    - *Fix:* Ensure `Sheet` (from ui/sheet) is used correctly for the mobile menu, with a proper backdrop and auto-close on navigation.
- [ ] **Layout Overflow:** Horizontal scrolling appears on screens < 375px; cards are cut off.
    - *Fix:* Review global padding logic (`container mx-auto p-4`). Ensure main content area uses `w-full` and `overflow-x-hidden` where appropriate. Use flex-wrap for Metric Cards.

### F. Habits Module
- [ ] **Habit Edit Broken:** Clicking "Edit" in the habit modal does nothing. It must open the edit form, populated with the habit's real data (true information), not placeholders.
    - *Fix:* Connect the "Edit" button to switch the modal to editing mode, fetching and filling the form with `habit` data (name, frequency, etc.).
- [ ] **Habit Progress Update:** The modal should allow updating the progress (checking off days or incrementing count) directly when opened.
    - *Fix:* Ensure the habit details modal includes the interactive "Mark as done" or progress input, syncing strictly with the real database state.
- [ ] **Habit Data Integrity:** The habits dashboard ("Hábitos" card vs list) displays inconsistent or placeholder data.
    - *Fix:* Verify `useHabits` hooks and calculations in `HabitsPage`. Ensure the summary cards (Streak, Rate, Today's Completion) are aggregating real data from the user's active habits list.

### G. Profile & Gamification
- [ ] **Achievements Preview Only:** The "Conquistas" section on the main profile page should only show a quick preview (e.g., top 3 badges), not the entire empty list.
    - *Fix:* Create a "Recent Achievements" summary component for the profile overview.
- [ ] **Gamify All Modules:** Implement achievements for Finance, Tasks, Habits, and Goals.
    - *Fix:* Expand the `achievements` system to listen for events in all modules (e.g., "First Task", "First Hybrid", "Goal Reached", "Budget Kept") and assign badges accordingly.

## 2. New Features: Proactive Push Notifications

### Objective
Notify users about upcoming tasks and calendar events to increase engagement and reliability.

### Implementation Strategy: Scheduled Edge Function (Cron)
Create a Supabase Edge Function (`scheduled-push-notifier`) triggered via `pg_cron` (or Supabase Cron) to run periodically (e.g., every 30 mins).

#### A. Task Notifications
- **Triggers:**
    - "Task Almost Due" (e.g., 24h before).
    - "Task Due Today" (Morning check).
- **Logic:** Query tasks where `due_date` matches criteria and `status` is not 'done'.

#### B. Calendar Notifications
- **Triggers:**
    - "Event Today" (Morning digest).
    - "Event Starting Soon" (30 minutes before `start_time`).
- **Logic:** Query `calendar_events` matching time windows.

### Technical Requirements
- [ ] Create `scheduled-push-notifier` Edge Function.
- [ ] Configure `pg_cron` or Supabase UI Cron scheduler.
- [ ] Reuse `send-push` logic (or import shared module).
- [ ] Add `last_notified_at` or similar tracking to avoid duplicate pushes for the same event.
