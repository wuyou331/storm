import { Blog, User, Comment } from "./model";
import { From } from "../src/sql_expr";
import { SqlUtils } from "../src/sql_utils";




test('from', () => {

    expect(From(Blog).ToSql()).toEqual("select * from Blog");
    expect(From(Blog, "b").ToSql()).toEqual("select * from Blog as b");

});

test('join', () => {

    expect(From(Blog)
        .Join(User).ON((b, u) => b.UserId === u.Id)
        .ToSql())
        .toEqual([`select * from Blog as b`,
            `join users as u on b.UserId = u.user_id`].join(SqlUtils.NewLine))

    expect(From(Blog)
        .InnerJoin(User).ON((b, u) => b.UserId === u.Id)
        .ToSql())
        .toEqual([`select * from Blog as b`,
            `inner join users as u on b.UserId = u.user_id`].join(SqlUtils.NewLine))

    expect(From(Blog)
        .LeftJoin(User).ON((b, u) => b.UserId === u.Id)
        .ToSql())
        .toEqual([`select * from Blog as b`,
            `left join users as u on b.UserId = u.user_id`].join(SqlUtils.NewLine))

    expect(From(Blog)
        .RightJoin(User).ON((b, u) => b.UserId === u.Id)
        .ToSql())
        .toEqual([`select * from Blog as b`,
            `right join users as u on b.UserId = u.user_id`].join(SqlUtils.NewLine))

    expect(From(Blog)
        .Join(User).ON((b, u) => b.UserId === u.Id && b.Id > 0)
        .ToSql())
        .toEqual([`select * from Blog as b`,
            `join users as u on (b.UserId = u.user_id and b.Id > 0)`].join(SqlUtils.NewLine))

    expect(From(Comment)
        .Join(Blog).ON((c, b) => c.BlogId === b.Id)
        .Join(Blog, User).ON((b, bu) => b.UserId === bu.Id)
        .Join(Comment, User).ON((c, cu) => c.UserId === cu.Id)
        .ToSql())
        .toEqual(["select * from Comment as c",
            "join Blog as b on c.BlogId = b.Id",
            "join users as bu on b.UserId = bu.user_id",
            "join users as cu on c.UserId = cu.user_id"].join(SqlUtils.NewLine))


});

test('select fields', () => {
    expect(From(Blog).Select().ToSql()).toEqual("select * from Blog");

    expect(From(Blog).Select("*").ToSql()).toEqual("select * from Blog");

    expect(From(Blog).Select(b => b).ToSql()).toEqual("select Id,UserId,Title from Blog");

    
    expect(From(User).Select(u => u).ToSql()).toEqual("select user_id,Name,Gender from users");

    expect(From(Blog)
        .Join(User).ON((b, u) => b.UserId === u.Id)
        .Select<Blog, User>((b, u) => ({ b, userName: u.Name, author: "joe" }))
        .ToSql())
        .toEqual([`select b.Id,b.UserId,b.Title,u.Name as userName,'joe' as author from Blog as b`,
            `join users as u on b.UserId = u.user_id`].join(SqlUtils.NewLine))


});



test('where', () => {


});