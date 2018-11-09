import { Injector } from "@furystack/inject";
import { expect } from "chai";
import { ContentDescriptorStore } from "../src";
import { ContentType, IContentTypeDecoratorOptions } from "../src/Decorators/ContentType";
import { Field, IFieldTypeDecoratorOptions } from "../src/Decorators/Field";
import { IReferenceTypeDecoratorOptions, Reference } from "../src/Decorators/Reference";
export const contentTypeDecoratorTests = describe("@ContentType() decorator", () => {
    /** */
    it("Should", () => {

        const injector = new Injector();
        injector.SetInstance(new ContentDescriptorStore());
        @ContentType({ DisplayName: "My Test Class", Injector: injector })
        class TestClass {
            @Field({ DisplayName: "User Name Display Name", Injector: injector })
            public Username!: string;

            @Reference({ DisplayName: "Referenceke", Injector: injector })
            public Valami!: object;
        }

        const value = injector.GetInstance(ContentDescriptorStore).ContentTypeDescriptors.get(TestClass) as IContentTypeDecoratorOptions;

        expect(value.DisplayName).to.be.eq("My Test Class");
        expect((value.Fields.get("Username") as IFieldTypeDecoratorOptions).DisplayName).to.be.eq("User Name Display Name");
        expect((value.References.get("Valami") as IReferenceTypeDecoratorOptions).DisplayName).to.be.eq("Referenceke");
    });
});
