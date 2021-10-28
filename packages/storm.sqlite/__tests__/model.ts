import { alias } from "storm";

export class Blog {
    @alias("id")
    public Id: number
}
