import { alias } from "./src/meta"
import { From } from "./src/sql_expr"



@alias("用户表")
class User {
    @alias("userId")
   public Id: number
   public  Name: string
   public  Gender: boolean
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
const item = { a: 1321, b: { v: 321 } }

const r = { a: Math.random() }

const sql = From(Blog)
    .Join(User).ON((b, bu) => b.UserId === bu.Id)
    .Join(Comment).ON((b, c) => c.BlogId === b.Id)
    .LeftJoin(Comment, User).ON((c, cu) => c.UserId === cu.Id)
    .Where(b => b.Id === r.a)
    .Where<User, User>((bu, cu) => bu.Id === item.b.v || cu.Id === item.a)
    .Select(bu => (bu))



console.info(sql.ToSql())

console.info(typeof sql)
console.info(typeof 1)
console.info(typeof {})

