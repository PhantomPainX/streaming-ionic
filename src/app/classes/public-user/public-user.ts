import { UserGroups } from "../user-groups/user-groups";

export class PublicUser {

    private id: number;
    private url: string;
    private username: string;
    private is_staff: boolean;
    private email: string;
    private groups: UserGroups;

    constructor(id: number, url: string, username: string, is_staff: boolean, email: string, groups: UserGroups) {
        this.id = id;
        this.url = url;
        this.username = username;
        this.is_staff = is_staff;
        this.email = email;
        this.groups = groups;
    }

}
