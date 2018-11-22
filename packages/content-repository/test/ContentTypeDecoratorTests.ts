import { Injector } from "@furystack/inject";
import { ContentDescriptorStore } from "../src";
import { ContentType } from "../src/Decorators/ContentType";
import { Field } from "../src/Decorators/Field";
import { Reference } from "../src/Decorators/Reference";
export const contentTypeDecoratorTests = describe("@ContentType() decorator", () => {
    /** */
    it("Should", () => {

        const injector = new Injector({owner: "ContentTypeDecoratorTests", parent: undefined});
        injector.SetInstance(new ContentDescriptorStore());
        @ContentType({ DisplayName: "My Test Class", Injector: injector })
        class TestClass {
            @Field({ DisplayName: "User Name Display Name", Injector: injector })
            public Username!: string;

            @Reference({ DisplayName: "Referenceke", Injector: injector })
            public Valami!: object;
        }

        const value = injector.GetInstance(ContentDescriptorStore).ContentTypeDescriptors.get(TestClass);
        expect(value).toBeTruthy();
        expect(value && value.Fields).toBeTruthy();
        if (value && value.Fields) {
            expect(value.DisplayName).toEqual("My Test Class");
            expect((value.Fields.Username).DisplayName).toEqual("User Name Display Name");
            expect((value.Fields.Valami).DisplayName).toEqual("Referenceke");
        }
    });
});
