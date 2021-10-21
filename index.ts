import { alias  } from "./src/meta"
import { From } from "./src/sql_expr"



@alias("用户表")
class User {
    @alias("userId")
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

let r = {a:Math.random()}

let sql = From(Blog)
    .Join(User).ON((b, bu) => b.UserId == bu.Id)
    .Join(Comment).ON((b, c) => c.BlogId == b.Id)
    .Join(Comment, User).ON((c, cu) => c.UserId == cu.Id)
    .Where(b => b.Id == r.a)
    .Where<User>(bu => bu.Id == item.b.v || bu.Id == item.a)
    .ToSql()


console.info(sql)

