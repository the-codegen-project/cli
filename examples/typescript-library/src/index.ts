import { ReservedUndefined } from "./__gen__/ReservedUndefined";

const payload = new ReservedUndefined({});
payload.displayName = "Lagoni";
payload.email = "lagoni@lagoni.com";
console.log(`User was ${payload.marshal()}`);
