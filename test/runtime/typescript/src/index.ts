import { UserSignedUp } from "./__gen__/UserSignedUp";

const payload = new UserSignedUp({});
payload.displayName = "Lagoni"
payload.email = "lagoni@lagoni.com"
console.log(`User was ${payload.marshal()}`)