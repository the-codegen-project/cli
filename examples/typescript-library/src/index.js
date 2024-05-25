"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UserSignedUp_1 = require("./__gen__/UserSignedUp");
const payload = new UserSignedUp_1.UserSignedUp({});
payload.displayName = "Lagoni";
payload.email = "lagoni@lagoni.com";
console.log(`User was ${payload.marshal()}`);
