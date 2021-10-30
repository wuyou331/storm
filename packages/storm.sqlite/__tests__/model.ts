import { alias, insertIgnore, updateIgnore } from "storm";

export class Blog {

    @insertIgnore()
    @updateIgnore()
    public id: number

    public name:string
}
