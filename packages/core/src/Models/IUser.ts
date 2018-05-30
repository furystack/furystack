import { IdentityClaims } from "../Claims";

export const visitorUser: IUser = {
    Id: 0,
    Username: "Visitor",
    Claims: [IdentityClaims.IsVisitor],
};

export interface IUser {
    Id: number;
    Username: string;
    Claims: string[];
}
