import { alias, insertIgnore, updateIgnore } from "storm";
@alias("a_test")
export class Blog {

    @insertIgnore()
    @updateIgnore()
    public id: number

    public name:string
}
