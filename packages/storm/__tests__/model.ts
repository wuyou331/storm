import { alias, ignore, insertIgnore, updateIgnore } from "../src/meta"
import { selectIgnore } from './../src/meta';


@alias("users")
export class User {
    @alias("user_id")

    public Id: number
    @alias("name")
    public Name: string
    public Gender: boolean
}

export class Blog {
    @insertIgnore()
    @updateIgnore()
    Id: number
    UserId: number
    Title: string
    @selectIgnore()
    Context?:string
}

export class Comment {
    Id: number
    UserId: number
    BlogId: number
    Content: string
}