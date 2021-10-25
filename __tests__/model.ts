import { alias } from "../src/meta"

@alias("users")
export class User {
    @alias("user_id")
    public Id: number
    public Name: string
    public Gender: boolean
}

export class Blog {
    Id: number
    UserId: number
    Title: string
}

export class Comment {
    Id: number
    UserId: number
    BlogId: number
    Content: string
}