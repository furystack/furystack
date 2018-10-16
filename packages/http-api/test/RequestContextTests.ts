import { IdentityClaims } from "@furystack/core";
import { visitorUser } from "@furystack/core/dist/Models";
import { expect } from "chai";
import { IdentityService } from "../src/IdentityService";
import { RequestContext } from "../src/RequestContext";
export const requestContextTests = describe("RequestContext", () => {

    const r = new RequestContext({ headers: {} } as any, null as any, new IdentityService());

    it("should be constructed", () => {
        expect(r).to.be.instanceof(RequestContext);
    });

    it("currentUser should return Visitor by default", async () => {
        const user = await r.getCurrentUser();
        expect(user).to.be.eq(visitorUser);
    });

    it("IsAuthorized should return true for visitor by default", async () => {
        const authorized = await r.isAuthorized(IdentityClaims.IsVisitor);
        expect(authorized).to.be.eq(true);
    });

    it("IsAuthorized should return false for not-applied claims", async () => {
        const authorized = await r.isAuthorized("example-not-applied-claim-value");
        expect(authorized).to.be.eq(false);
    });

    it("IsAuthenticated should return false by default", async () => {
        const authenticated = await r.isAuthenticated();
        expect(authenticated).to.be.eq(false);
    });

});
