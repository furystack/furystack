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
        it("Should transform plain object to the defined value", async () => {
            const transformed = await av.TransformPlainContent<{ UserName: string }>({
                content: {
                Id: 123,
                Type: {
                    Fields: {
                        UserName: {
                            Type: "Value",
                        },
                    },
                } as any,
                ContentTypeRef: undefined as any,
                CreationDate: new Date(),
                ModificationDate: new Date(),
                Fields: [
                    {
                        Id: 123,
                        Name: "UserName",
                        Value: "Béla",
                        Content: undefined as any,
                    },
                ],
            },
            aspect: {
                    Fields: {
                        0: {
                            ReadOnly: false,
                            Required: false,
                            FieldName: "UserName",
                        },
                    },
                },
                loadRef: () => Promise.resolve({Id: 1}) as any,
            });
            const expectedValue = { Id: 123, UserName: "Béla" };
            for (const key of Object.keys(expectedValue)) {
                expect(transformed[key as keyof typeof transformed]).toEqual(expectedValue[key as keyof typeof expectedValue]);
            }
        });
    });

    describe("GetAspect", () => {

        it("Should return undefined when no aspect has been found", () => {
            const aspect = av.GetAspect({
                Id: 123,
                ContentTypeRef: null as any,
                Fields: [],
                CreationDate: new Date(),
                ModificationDate: new Date(),
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
                CreationDate: new Date(),
                ModificationDate: new Date(),
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
                CreationDate: new Date(),
                ModificationDate: new Date(),
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
                    CreationDate: new Date(),
                    ModificationDate: new Date(),
                    Type: {
                        Name: "ContentType",
                        Aspects: {},
                    },
                }, "Create");
            }).toThrowError("Aspect 'Create' not found for content type 'ContentType'");
        });
    });

});
