import { alias } from "../src/meta"

@alias("用户表")
export class User {
    @alias("userId")
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