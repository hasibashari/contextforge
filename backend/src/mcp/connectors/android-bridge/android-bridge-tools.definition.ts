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
      'Retrieve raw application usage metrics and foreground screen time durations recorded since 00:00 today.',
    readOnly: true,
    parametersSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
  {
    id: 't-android-3',
    name: 'android_get_usage_summary',
    description:
      'Fetch structured daily Digital Wellbeing telemetry including total screen time, breakdown of top used apps, and most distracting applications for AI analysis.',
    readOnly: true,
    parametersSchema: {
      type: 'object',
      properties: {},
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
];
