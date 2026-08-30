import { McpToolDefinition } from '../../core';

/**
 * Declarative Tool Definitions for Android Bridge & Digital Wellbeing MCP Connector
 */
export const ANDROID_BRIDGE_MCP_TOOLS: McpToolDefinition[] = [
  {
    id: 't-android-1',
    name: 'android_get_device_status',
    description:
      'Check whether the Android MCP Bridge server is active, accessible, and running on the connected mobile device.',
    readOnly: true,
    parametersSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    id: 't-android-2',
    name: 'android_get_usage',
    description:
      'Retrieve raw application usage metrics and foreground screen time durations recorded on the Android device for today or across a specified number of historical days.',
    readOnly: true,
    parametersSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description:
            'Number of past days of usage data to query (e.g. 1 for today only, 7 for past week). Defaults to 1.',
        },
        date: {
          type: 'string',
          description:
            'Specific reference date in YYYY-MM-DD format. Defaults to current date.',
        },
      },
      required: [],
    },
  },
  {
    id: 't-android-3',
    name: 'android_get_usage_summary',
    description:
      'Fetch structured Digital Wellbeing telemetry including total screen time, top apps breakdown, average daily usage, and daily trends for AI anomaly reasoning and historical comparison.',
    readOnly: true,
    parametersSchema: {
      type: 'object',
      properties: {
        days: {
          type: 'number',
          description:
            'Number of past days for historical baseline and trend analysis (e.g. 7 for a 7-day weekly trend, 14, 30). Defaults to 1.',
        },
        date: {
          type: 'string',
          description:
            'Specific date in YYYY-MM-DD format to analyze. Defaults to today.',
        },
      },
      required: [],
    },
  },
  {
    id: 't-android-4',
    name: 'android_get_foreground_app',
    description:
      'Detect the package name of the application currently active on the device screen in real time.',
    readOnly: true,
    parametersSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    id: 't-android-5',
    name: 'android_set_app_limit',
    description:
      'Set a maximum daily usage time limit in minutes for a specific application package (e.g. "com.instagram.android").',
    readOnly: false,
    parametersSchema: {
      type: 'object',
      properties: {
        packageName: {
          type: 'string',
          description:
            'Target Android package name (e.g. "com.instagram.android", "com.google.android.youtube")',
        },
        maxDailyMinutes: {
          type: 'number',
          description:
            'Maximum allowed usage duration in minutes per day (e.g. 45)',
        },
      },
      required: ['packageName', 'maxDailyMinutes'],
    },
  },
  {
    id: 't-android-6',
    name: 'android_block_app',
    description:
      'Instantly block or unblock an application on the Android device. Blocked apps will immediately trigger home redirection and alert overlay.',
    readOnly: false,
    parametersSchema: {
      type: 'object',
      properties: {
        packageName: {
          type: 'string',
          description:
            'Target Android package name (e.g. "com.tiktok.android")',
        },
        block: {
          type: 'boolean',
          description:
            'True to block immediately, False to unblock and restore access',
        },
      },
      required: ['packageName', 'block'],
    },
  },
  {
    id: 't-android-7',
    name: 'android_get_active_restrictions',
    description:
      'Retrieve all configured daily time limits and the active list of currently blocked applications on the device.',
    readOnly: true,
    parametersSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    id: 't-android-8',
    name: 'android_set_dnd',
    description:
      'Toggle Do Not Disturb (DND) mode on the Android device to suppress notification alerts during focused work sessions.',
    readOnly: false,
    parametersSchema: {
      type: 'object',
      properties: {
        enable: {
          type: 'boolean',
          description:
            'True to enable Do Not Disturb mode, False to disable and restore standard alerts',
        },
      },
      required: ['enable'],
    },
  },
  {
    id: 't-android-9',
    name: 'android_send_notification',
    description:
      'Send a local push notification / alert banner to the Android device status bar.',
    readOnly: false,
    parametersSchema: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Notification title header',
        },
        message: {
          type: 'string',
          description: 'Notification body message content',
        },
      },
      required: ['title', 'message'],
    },
  },
  {
    id: 't-android-10',
    name: 'android_unblock_app',
    description:
      "Unblock a previously blocked application on the Android device, restoring the user's full access to it.",
    readOnly: false,
    parametersSchema: {
      type: 'object',
      properties: {
        packageName: {
          type: 'string',
          description:
            'Android package name of the app to unblock (e.g. "com.instagram.android")',
        },
      },
      required: ['packageName'],
    },
  },
  {
    id: 't-android-11',
    name: 'android_reset_all_restrictions',
    description:
      'Master reset: removes all active app time limits, unblocks all blocked applications, and disables the bedtime curfew schedule. Returns the device to an unrestricted state.',
    readOnly: false,
    parametersSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    id: 't-android-12',
    name: 'android_get_screen_time_status',
    description:
      'Retrieve a comprehensive all-in-one screen time status snapshot: total usage today, daily quota limit, whether the limit is exceeded, bedtime curfew status, and active restrictions count. Use this before deciding on an intervention action.',
    readOnly: true,
    parametersSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    id: 't-android-13',
    name: 'android_set_bedtime_schedule',
    description:
      'Configure the nightly Bedtime Curfew schedule: set the start and end time (HH:MM format, 24h) and toggle whether the schedule is active.',
    readOnly: false,
    parametersSchema: {
      type: 'object',
      properties: {
        startTime: {
          type: 'string',
          description:
            'Curfew start time in HH:MM 24-hour format (e.g. "22:00" for 10 PM)',
        },
        endTime: {
          type: 'string',
          description:
            'Curfew end time in HH:MM 24-hour format (e.g. "06:00" for 6 AM)',
        },
        enabled: {
          type: 'boolean',
          description:
            'True to activate the bedtime curfew schedule, false to disable it',
        },
      },
      required: ['startTime', 'endTime', 'enabled'],
    },
  },
  {
    id: 't-android-14',
    name: 'android_set_total_screen_time_limit',
    description:
      'Set a global maximum daily screen time limit in minutes that applies across all applications on the device.',
    readOnly: false,
    parametersSchema: {
      type: 'object',
      properties: {
        maxDailyMinutes: {
          type: 'number',
          description:
            'Maximum total screen time allowed per day in minutes (e.g. 240 for 4 hours)',
        },
      },
      required: ['maxDailyMinutes'],
    },
  },
  {
    id: 't-android-15',
    name: 'android_get_bedtime_config',
    description:
      'Read the current bedtime curfew schedule configuration and total daily screen time limit stored on the device.',
    readOnly: true,
    parametersSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    id: 't-android-16',
    name: 'android_trigger_bedtime_lock',
    description:
      'Immediately trigger the Bedtime Lock Screen (Zen Bedtime Screen) on the Android device with a relaxation message, showing when the screen will next be accessible.',
    readOnly: false,
    parametersSchema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          description:
            'Optional custom zen/relaxation message to display on the lock screen (e.g. "Time to rest. See you at 6 AM 🌙")',
        },
      },
      required: [],
    },
  },
  {
    id: 't-android-17',
    name: 'android_send_agent_message',
    description:
      'Send a psychology-informed mindful coaching intervention to the user. Choose "heads_up" for a gentle ambient pop-up nudge, or "companion_modal" for a full bottom-sheet mindful pause with breathing prompt and optional wrap-up extension.',
    readOnly: false,
    parametersSchema: {
      type: 'object',
      properties: {
        style: {
          type: 'string',
          enum: ['heads_up', 'companion_modal'],
          description:
            '"heads_up": subtle floating notification that does not interrupt the user\'s activity. "companion_modal": immersive bottom-sheet dialog for a mindful pause moment.',
        },
        title: {
          type: 'string',
          description: 'Message title shown in the intervention UI',
        },
        message: {
          type: 'string',
          description:
            'The main coaching text or mindful prompt to display to the user',
        },
        allowExtension: {
          type: 'boolean',
          description:
            'If true, the companion modal will offer a 1-minute wrap-up extension button before locking the app (default: false)',
        },
        extensionMinutes: {
          type: 'number',
          description:
            'Duration in minutes for the wrap-up extension window offered to the user (default determined by Android app, typically 1)',
        },
      },
      required: ['style', 'title', 'message'],
    },
  },
];
