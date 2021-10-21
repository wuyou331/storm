import { Expression } from "tst-expression"
import { From } from "./src/sql_expr"







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
let a = 1321
function Sql(){
    let b=321
    return From(Blog)
    .Join(User).ON((b, bu) => b.UserId == bu.Id)
    .Join(Comment).ON((b, c) => c.BlogId == b.Id)
    .Join(Comment, User).ON((c, cu) => c.UserId == cu.Id)
    .Where(b => b.Id == a)
    .Where<User>(u => u.Id == b || true)
    .ToSql()
}

console.info(Sql())



