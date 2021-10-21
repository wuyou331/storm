import { Expression } from "tst-expression"
import { Alias } from "./src/meta"
import { From } from "./src/sql_expr"



@Alias("用户表")
class User {
    Id: number
    Name: string
    Gender: boolean
}

class Blog {
    Id: number
    UserId: number
    Title: string
}

class Comment {
    Id: number
    UserId: number
    BlogId: number
    Content: string
}
let item = { a: 1321, b: { v: 321 } }

let r = Math.random()
let sql = From(Blog)
    .Join(User).ON((b, bu) => b.UserId == bu.Id)
    .Join(Comment).ON((b, c) => c.BlogId == b.Id)
    .Join(Comment, User).ON((c, cu) => c.UserId == cu.Id)
    .Where(b => b.Id == r)
    .Where<User>(u => u.Id == item.b.v || u.Id == item.a)
    .ToSql()


console.info(sql)



