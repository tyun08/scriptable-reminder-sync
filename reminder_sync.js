// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: pink; icon-glyph: magic;

// Global binary variable to control if the script should modify data or just log changes
const MODIFY_DATA = true;

const SCHEDULED_ICON = "";
const CHECKMARK_ICON = "✅";

const TO_DO_LIST = "# To Do List";
const WATCH_LIST = "# Watch List";

let i = 0;

//function to get a startDate and endDate that is dur_month months before and after today

const get_start_end_date = (dur_month) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - dur_month);
  console.log(`日曆的開始時間 ${startDate.toLocaleDateString()}`);

  const endDate = new Date();
  endDate.setMonth(endDate.getMonth() + dur_month*6);
  console.log(`日曆的結束時間 ${endDate.toLocaleDateString()}`);

  return [startDate, endDate];
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
const events = await CalendarEvent.between(...get_start_end_date(1));
const completedReminders = await Reminder.completedBetween(
  ...get_start_end_date(1)
);

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

    if (
      reminder.calendar.title !== WATCH_LIST &&
      reminder.calendar.title !== TO_DO_LIST
    ) {
      continue;
    }

    reminder.calendar = reminder_calendars[TO_DO_LIST];
    i += 1;
    console.log(
      `Change Log ${i}: Moving reminder "${reminder.title}" to # To Do List calendar`
    );

    const newDueDate = targetEvent.startDate;
    reminder.dueDate = newDueDate;

    i += 1;
    console.log(
      `Change Log ${i}: Updating reminder "${reminder.title}" due date to ${newDueDate}`
    );

    // if (!reminder.title.startsWith(SCHEDULED_ICON)) {
    //   reminder.title = `${SCHEDULED_ICON}${reminder.title}`;

    //   i += 1;
    //   console.log(
    //     `Change Log ${i}: Adding scheduled icon to reminder "${reminder.title}"`
    //   );
    // }

    // if (!targetEvent.title.startsWith(SCHEDULED_ICON)) {
    //   targetEvent.title = `${SCHEDULED_ICON}${targetEvent.title}`;

    //   i += 1;
    //   console.log(
    //     `Change Log ${i}: Adding scheduled icon to event "${targetEvent.title}"`
    //   );
    // }

    if (targetEvent.calendar.title !== TO_DO_LIST) {
      targetEvent.calendar = event_calendars[TO_DO_LIST];
      i += 1;
      console.log(
        `Change Log ${i}: Change Calendar type to "${targetEvent.calendar.title}"`
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
    if (!reminder.calendar.title === TO_DO_LIST) {
      continue;
    }

    const targetEvent = match_target_event(reminder, events);

    if (!targetEvent) {
      continue;
    }

    if (!targetEvent.title.startsWith(CHECKMARK_ICON)) {
      //remove scheduled icon from event title

      // targetEvent.title = targetEvent.title.replace(SCHEDULED_ICON, "");

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

const match_target_event = (reminder, events) => {
  //find when the e.title start with the reminder title
  //because calendar title will carry over the reminder title
  const targetEvent = events.find((e) => e.title.startsWith(reminder.title));

  // const targetEvent = events.find((e) => e.title === reminder.title);
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
