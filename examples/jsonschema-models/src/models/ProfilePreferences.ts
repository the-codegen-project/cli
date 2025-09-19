import {ProfilePreferencesTheme} from './ProfilePreferencesTheme';
class ProfilePreferences {
  private _theme?: ProfilePreferencesTheme;
  private _notifications?: boolean;

  constructor(input: {
    theme?: ProfilePreferencesTheme,
    notifications?: boolean,
  }) {
    this._theme = input.theme;
    this._notifications = input.notifications;
  }

  get theme(): ProfilePreferencesTheme | undefined { return this._theme; }
  set theme(theme: ProfilePreferencesTheme | undefined) { this._theme = theme; }

  get notifications(): boolean | undefined { return this._notifications; }
  set notifications(notifications: boolean | undefined) { this._notifications = notifications; }
}
export { ProfilePreferences };