import {CLI_KIT_VERSION} from '@shopify/cli-kit/common/version'
import Command from '@shopify/cli-kit/node/base-command'
import {writeFile} from '@shopify/cli-kit/node/fs'
import {Notification, Notifications, getLocalNotifications} from '@shopify/cli-kit/node/notifications-system'
import {renderSelectPrompt, renderSuccess, renderTextPrompt} from '@shopify/cli-kit/node/ui'
import {randomUUID} from 'crypto'

export default class Generate extends Command {
  static description = 'Generate a new notification for the the CLI.'

  static hidden = true

  async run(): Promise<void> {
    const today = new Date()
    const formattedToday = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today
      .getDate()
      .toString()
      .padStart(2, '0')}`
    const id = randomUUID()
    const type: 'info' | 'warning' | 'error' = await renderSelectPrompt({
      message: 'Type of message?',
      choices: [
        {label: 'Info', value: 'info'},
        {label: 'Warning', value: 'warning'},
        {label: 'Error', value: 'error'},
      ],
    })
    const title = await renderTextPrompt({
      message: 'Title',
    })
    const message = await renderTextPrompt({
      message: 'Message',
    })
    const frequency: 'always' | 'once' | 'once_a_day' | 'once_a_week' = await renderSelectPrompt({
      message: 'Frequency',
      choices: [
        {label: 'Always', value: 'always'},
        {label: 'Only once', value: 'once'},
        {label: 'Once a day', value: 'once_a_day'},
        {label: 'Once a week', value: 'once_a_week'},
      ],
    })
    const minVersion = await renderTextPrompt({
      message: 'Minimum CLI version (optional)',
      initialAnswer: CLI_KIT_VERSION,
      allowEmpty: true,
    })
    const maxVersion = await renderTextPrompt({
      message: 'Maximum CLI version (optional)',
      initialAnswer: CLI_KIT_VERSION,
      allowEmpty: true,
    })
    const minDate = await renderTextPrompt({
      message: 'Minimum date in YYYY-MM-DD format (optional)',
      initialAnswer: formattedToday,
      allowEmpty: true,
    })
    const maxDate = await renderTextPrompt({
      message: 'Maximum date in YYYY-MM-DD format (optional)',
      initialAnswer: formattedToday,
      allowEmpty: true,
    })
    const surface = await renderTextPrompt({
      message: 'Surface. E.g.: app, theme, hydrogen, theme_app_extension... (optional)',
      allowEmpty: true,
    })
    const commands = await renderTextPrompt({
      message: 'Comma separated list of commands. E.g.: app:generate:extension (optional)',
      allowEmpty: true,
    })
    const notifications: Notifications = await getLocalNotifications()

    const notification: Notification = {
      id,
      type,
      title,
      frequency,
      message,
      minVersion: minVersion.length === 0 ? undefined : minVersion,
      maxVersion: maxVersion.length === 0 ? undefined : maxVersion,
      minDate: minDate.length === 0 ? undefined : minDate,
      maxDate: maxDate.length === 0 ? undefined : maxDate,
      surface: surface.length === 0 ? undefined : surface,
      commands: commands.length === 0 ? undefined : commands.split(',').map((command) => command.trim()),
    }
    notifications.notifications.push(notification)
    await writeFile('./notifications.json', JSON.stringify(notifications))

    renderSuccess({headline: 'notifications.json file updated successfully.'})
  }
}