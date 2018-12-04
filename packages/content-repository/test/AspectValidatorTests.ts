import { AspectValidator } from "../src/AspectValidator";
import { IAspect } from "../src/models";

describe("Aspect Validator", () => {
    const av = new AspectValidator();

    it("Should return true for empty fields", () => {
        /**/
        const result = av.ValidateAspect({ a: 1 }, {}, {
        });
        expect(result.isValid).toBeTruthy();
    });

    it("Should return true for valid aspects", () => {
        /**/
        const result = av.ValidateAspect({ a: 1 }, {}, {
            Fields: {
                a: {
                    Required: true,
                },
            },
        } as IAspect<{ a: number }>);
        expect(result.isValid).toBeTruthy();
    });

    it("Should return false and fill missing fields", () => {
        /**/
        const result = av.ValidateAspect({ a: undefined as any }, {}, {
            Fields: {
                a: {
                    Required: true,
                },
            },
        } as IAspect<{ a: number }>);
        expect(result.isValid).toBeFalsy();
        expect(result.readonly.length).toEqual(0);
        expect(result.missing).toContain("a");
    });

    it("Should return false and fill read only fields", () => {
        /**/
        const result = av.ValidateAspect({ a: 1 as any }, { a: 2 }, {
            Fields: {
                a: {
                    ReadOnly: true,
                },
            },
        } as IAspect<{ a: number }>);
        expect(result.isValid).toBeFalsy();
        expect(result.missing.length).toEqual(0);
        expect(result.readonly).toContain("a");
    });
});
