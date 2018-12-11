import { IUser } from "@furystack/core";
import { SelectQueryBuilder as OriginalSelectQueryBuilder } from "typeorm";
import { ISavedContent } from "./models";
import { IPermissionEntry } from "./models/IPermissionEntry";

declare module "typeorm" {
    // tslint:disable-next-line:interface-name
    export interface SelectQueryBuilder<Entity> {
        withPermission<TUser extends ISavedContent<IUser>>(user: TUser, permissionName: string): this;
    }
}

// tslint:disable-next-line:only-arrow-functions
(OriginalSelectQueryBuilder.prototype as any).withPermission = function<TUser extends ISavedContent<IUser>>(user: TUser) {
    return hasPermission(this, user);
};

export const hasPermission = <TUser, T extends IPermissionEntry>(selectBuilder: OriginalSelectQueryBuilder<T>, user: TUser) => {
    return selectBuilder;
};

export {};
