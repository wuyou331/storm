import { alias } from "./src/meta"
import { From } from "./src/sql_expr"


@alias("users")
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

From(Blog)
        .Join(User).ON((b, u) => b.UserId === u.Id)
        .Select<Blog, User>((b, u) => ({ b, userName: u.Name ,author:"joe"}))
        .ToMergeSql()