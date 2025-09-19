import {ProfilePreferences} from './ProfilePreferences';
class Profile {
  private _bio?: string;
  private _website?: string;
  private _avatar?: string;
  private _preferences?: ProfilePreferences;

  constructor(input: {
    bio?: string,
    website?: string,
    avatar?: string,
    preferences?: ProfilePreferences,
  }) {
    this._bio = input.bio;
    this._website = input.website;
    this._avatar = input.avatar;
    this._preferences = input.preferences;
  }

  get bio(): string | undefined { return this._bio; }
  set bio(bio: string | undefined) { this._bio = bio; }

  get website(): string | undefined { return this._website; }
  set website(website: string | undefined) { this._website = website; }

  get avatar(): string | undefined { return this._avatar; }
  set avatar(avatar: string | undefined) { this._avatar = avatar; }

  get preferences(): ProfilePreferences | undefined { return this._preferences; }
  set preferences(preferences: ProfilePreferences | undefined) { this._preferences = preferences; }
}
export { Profile };