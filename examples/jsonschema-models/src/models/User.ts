import {RolesItem} from './RolesItem';
import {Profile} from './Profile';
class User {
  private _id: string;
  private _reservedName: string;
  private _email: string;
  private _age?: number;
  private _isActive?: boolean;
  private _roles?: RolesItem[];
  private _profile?: Profile;
  private _createdAt: string;
  private _updatedAt?: string;

  constructor(input: {
    id: string,
    reservedName: string,
    email: string,
    age?: number,
    isActive?: boolean,
    roles?: RolesItem[],
    profile?: Profile,
    createdAt: string,
    updatedAt?: string,
  }) {
    this._id = input.id;
    this._reservedName = input.reservedName;
    this._email = input.email;
    this._age = input.age;
    this._isActive = input.isActive;
    this._roles = input.roles;
    this._profile = input.profile;
    this._createdAt = input.createdAt;
    this._updatedAt = input.updatedAt;
  }

  get id(): string { return this._id; }
  set id(id: string) { this._id = id; }

  get reservedName(): string { return this._reservedName; }
  set reservedName(reservedName: string) { this._reservedName = reservedName; }

  get email(): string { return this._email; }
  set email(email: string) { this._email = email; }

  get age(): number | undefined { return this._age; }
  set age(age: number | undefined) { this._age = age; }

  get isActive(): boolean | undefined { return this._isActive; }
  set isActive(isActive: boolean | undefined) { this._isActive = isActive; }

  get roles(): RolesItem[] | undefined { return this._roles; }
  set roles(roles: RolesItem[] | undefined) { this._roles = roles; }

  get profile(): Profile | undefined { return this._profile; }
  set profile(profile: Profile | undefined) { this._profile = profile; }

  get createdAt(): string { return this._createdAt; }
  set createdAt(createdAt: string) { this._createdAt = createdAt; }

  get updatedAt(): string | undefined { return this._updatedAt; }
  set updatedAt(updatedAt: string | undefined) { this._updatedAt = updatedAt; }
}
export { User };