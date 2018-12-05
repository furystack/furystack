import { AspectManager } from "../src/AspectManager";
import { IAspect } from "../src/models";

describe("Aspect Manager", () => {
    const av = new AspectManager();

    describe("Validate", () => {
        it("Should return true for empty fields", () => {
            /**/
            const result = av.Validate({ a: 1 }, {}, {
            });
            expect(result.isValid).toBeTruthy();
        });

        it("Should return true for valid aspects", () => {
            /**/
            const result = av.Validate({ a: 1 }, {}, {
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
            const result = av.Validate({ a: undefined as any }, {}, {
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
            const result = av.Validate({ a: 1 as any }, { a: 2 }, {
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

    describe("TransformPlainContent", () => {
        it("Should transform plain object to the defined value", () => {
            const transformed = av.TransformPlainContent<{ UserName: string }>({
                Id: 123,
                Type: undefined as any,
                ContentTypeRef: undefined as any,
                Fields: [
                    {
                        Id: 123,
                        Name: "UserName",
                        Value: "Béla",
                        Content: undefined as any,
                    },
                ],
            }, {
                    Fields: {
                        0: {
                            ReadOnly: false,
                            Required: false,
                            FieldName: "UserName",
                        },
                    },
                });
            expect(transformed).toEqual({ Id: 123, UserName: "Béla" });
        });
    });

    describe("GetAspect", () => {

        it("Should return undefined when no aspect has been found", () => {
            const aspect = av.GetAspect({
                Id: 123,
                ContentTypeRef: null as any,
                Fields: [],
                Type: {
                    Name: "ContentType",
                    Aspects: {},
                },
            }, "Create");
            expect(aspect).toBeUndefined();
        });

        it("Should return a valid aspect", () => {
            const a = {
                Fields: [],
                DisplayName: "Create Aspect",
            };
            const aspect = av.GetAspect({
                Id: 123,
                ContentTypeRef: null as any,
                Fields: [],
                Type: {
                    Name: "ContentType",
                    Aspects: {
                        Create: a,
                    },
                },
            }, "Create");
            expect(aspect).toEqual(a);
        });
    });

    describe("GetAspectOrFaile()", () => {
        it("Should return an aspect", () => {
            const a = {
                Fields: [],
                DisplayName: "Create Aspect",
            };
            const aspect = av.GetAspectOrFail({
                Id: 123,
                ContentTypeRef: null as any,
                Fields: [],
                Type: {
                    Name: "ContentType",
                    Aspects: {
                        Create: a,
                    },
                },
            }, "Create");
            expect(aspect).toEqual(a);
        });

        it("Should throw an error for non-existing aspects", () => {
            expect(() => {
                av.GetAspectOrFail({
                    Id: 123,
                    ContentTypeRef: null as any,
                    Fields: [],
                    Type: {
                        Name: "ContentType",
                        Aspects: {},
                    },
                }, "Create");
            }).toThrowError("Aspect 'Create' not found for content type 'ContentType'");
        });
    });

});
