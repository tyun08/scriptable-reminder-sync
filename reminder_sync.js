// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

// Global binary variable to control if the script should modify data or just log changes
const MODIFY_DATA = true;

const SCHEDULED_ICON = "📅";
const CHECKMARK_ICON = "✅";

let i = 0;

const get_recent_events = async () => {
  const dur_month = 1;

  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - dur_month);
  console.log(`日曆的開始時間 ${startDate.toLocaleDateString()}`);

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + dur_month);
  console.log(`日曆的結束時間 ${endDate.toLocaleDateString()}`);

  const events = await CalendarEvent.between(startDate, endDate);
  return events;
};

const get_calendar_types = (calendars) => {
  // log first 3 calendars
  for (const cal of calendars.slice(0, 3)) {
    console.log(`日曆: ${cal.title}`);
  }

  //獲取日曆名和對應的日曆
  var m_dict = {};
  for (cal of calendars) {
    m_dict[cal.title] = cal;
  }

  return m_dict;
};

const event_calendars = get_calendar_types(await Calendar.forEvents());
const reminder_calendars = get_calendar_types(await Calendar.forReminders());

const reminders = await Reminder.allIncomplete();
const events = await get_recent_events();
const completedReminders = await Reminder.allCompleted();

console.log(`獲取 ${reminders.length} 條提醒事項`);
console.log(`獲取 ${events.length} 條日曆`);

const main = () => {
  processIncompleteReminders(reminders, events);
  processCompletedReminders(completedReminders, events);
};

function processIncompleteReminders(reminders, events) {
  if (!reminders || reminders.length === 0) {
    console.warn("No InCompleted reminders found");
    return;
  }

  for (const reminder of reminders) {
    const targetEvent = match_target_event(reminder, events);

    if (!targetEvent) {
      continue;
    }

    if (reminder.calendar.title !== "# To Do List") {
      reminder.calendar = reminder_calendars["# To Do List"];
      i += 1;
      console.log(
        `Change Log ${i}: Moving reminder "${reminder.title}" to # To Do List calendar`
      );
    }

    const newDueDate = targetEvent.startDate;
    reminder.dueDate = newDueDate;

    i += 1;
    console.log(
      `Change Log ${i}: Updating reminder "${reminder.title}" due date to ${newDueDate}`
    );

    if (!reminder.title.startsWith(SCHEDULED_ICON)) {
      reminder.title = `${SCHEDULED_ICON}${reminder.title}`;

      i += 1;
      console.log(
        `Change Log ${i}: Adding scheduled icon to reminder "${reminder.title}"`
      );
    }

    if (!targetEvent.title.startsWith(SCHEDULED_ICON)) {
      targetEvent.title = `${SCHEDULED_ICON}${targetEvent.title}`;

      i += 1;
      console.log(
        `Change Log ${i}: Adding scheduled icon to event "${targetEvent.title}"`
      );
    }
    if (MODIFY_DATA) {
      reminder.save();
      targetEvent.save();
    }
  }
}

function processCompletedReminders(reminders, events) {
  if (!reminders || reminders.length === 0) {
    console.warn("No completed reminders found");
    return;
  }

  for (const reminder of reminders) {
    if (!reminder.calendar.title === "# To Do List") {
      continue;
    }

    const targetEvent = match_target_event(reminder, events);

    if (!targetEvent) {
      continue;
    }

    if (!targetEvent.title.startsWith(CHECKMARK_ICON)) {
      //remove scheduled icon from event title
      targetEvent.title = targetEvent.title.replace(SCHEDULED_ICON, "");

      targetEvent.title = `${CHECKMARK_ICON}${targetEvent.title}`;
      i += 1;
      console.log(
        `Change Log ${i}: Adding checkmark icon to event "${targetEvent.title}"`
      );
      if (MODIFY_DATA) {
        targetEvent.save();
      }
    }
  }
}

async function findOrCreateToDoListCalendar() {
  let toDoListCalendar = Calendar.find("# To Do List");
  if (!toDoListCalendar) {
    toDoListCalendar = new Calendar();
    toDoListCalendar.title = "# To Do List";
    toDoListCalendar.save();
  }
  return toDoListCalendar;
}

const match_target_event = (reminder, events) => {
  const targetEvent = events.find((e) => e.title === reminder.title);
  if (!targetEvent) {
    // console.log(`找不到相同標題的Calendar Events: ${reminder.title}`);
    return null;
  }

  console.log(`找到相同標題的Calendar Events: ${reminder.title}`);
  return targetEvent;
};

main();

console.log(`共執行 ${i} 條修改.`);

Script.complete();
