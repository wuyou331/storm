import { Blog, User, Comment } from "./model";
import { SqlUtils } from "../src/sql_utils";
import { From as from } from "./mock_expr";
import { ParamSql } from './../src/sql_expr_type';



test('from', () => {
    expect(from(Blog).toMergeSql()).toEqual("select * from Blog");
    expect(from(Blog, "b").toMergeSql()).toEqual("select * from Blog as b");

});

test('join', () => {

    expect(from(Blog)
        .join(User).on((b, u) => b.UserId === u.Id)
        .toMergeSql())
        .toEqual([`select * from Blog as b`,
            `join users as u on b.UserId = u.user_id`].join(SqlUtils.NewLine))

    expect(from(Blog)
        .innerJoin(User).on((b, u) => b.UserId === u.Id)
        .toMergeSql())
        .toEqual([`select * from Blog as b`,
            `inner join users as u on b.UserId = u.user_id`].join(SqlUtils.NewLine))

    expect(from(Blog)
        .leftJoin(User).on((b, u) => b.UserId === u.Id)
        .toMergeSql())
        .toEqual([`select * from Blog as b`,
            `left join users as u on b.UserId = u.user_id`].join(SqlUtils.NewLine))

    expect(from(Blog)
        .rightJoin(User).on((b, u) => b.UserId === u.Id)
        .toMergeSql())
        .toEqual([`select * from Blog as b`,
            `right join users as u on b.UserId = u.user_id`].join(SqlUtils.NewLine))

    expect(from(Blog)
        .join(User).on((b, u) => b.UserId === u.Id && b.Id > 0)
        .toMergeSql())
        .toEqual([`select * from Blog as b`,
            `join users as u on (b.UserId = u.user_id and b.Id > 0)`].join(SqlUtils.NewLine))

    expect(from(Comment)
        .join(Blog).on((c, b) => c.BlogId === b.Id)
        .join(Blog, User).on((b, bu) => b.UserId === bu.Id)
        .join(Comment, User).on((c, cu) => c.UserId === cu.Id)
        .toMergeSql())
        .toEqual(["select * from Comment as c",
            "join Blog as b on c.BlogId = b.Id",
            "join users as bu on b.UserId = bu.user_id",
            "join users as cu on c.UserId = cu.user_id"].join(SqlUtils.NewLine))


});

test('select fields', () => {
    expect(from(Blog).select().toMergeSql()).toEqual("select * from Blog");

    expect(from(Blog).select("*").toMergeSql()).toEqual("select * from Blog");

    expect(from(Blog).select(b => b).toMergeSql()).toEqual("select Id,UserId,Title from Blog");

    expect(from(Blog).select(b => ({ b, author: "joe" })).toMergeSql()).toEqual("select Id,UserId,Title,'joe' as author from Blog");

    expect(from(Blog).select(b => ({ b, author: "joe" })).toSql()).toEqual({
        sql: "select Id,UserId,Title,? as author from Blog",
        params: ["joe"]
    } as ParamSql);

    expect(from(User).select(u => u).toMergeSql()).toEqual("select user_id,name,Gender from users");


    expect(from(User).select((u: User) => ({ id: u.Id, name: u.Name })).toMergeSql()).toEqual("select user_id as id,name from users");

    expect(from(Blog)
        .join(User).on((b, u) => b.UserId === u.Id)
        .select((b: Blog, u: User) => ({ b, userName: u.Name, author: "joe" }))
        .toMergeSql())
        .toEqual([`select b.Id,b.UserId,b.Title,u.name as userName,'joe' as author from Blog as b`,
            `join users as u on b.UserId = u.user_id`].join(SqlUtils.NewLine))

});



test('where', () => {
    expect(from(Blog).where(b => b.Id === 123).toMergeSql())
        .toEqual(["select * from Blog"
            , "where Id = 123"].join(SqlUtils.NewLine));

    expect(from(Blog).where(b => b.Id === 123).toSql()).toEqual({
        sql: ["select * from Blog",
            "where Id = ?"].join(SqlUtils.NewLine),
        params: [123]
    } as ParamSql);

    expect(from(Blog).where(b => b.Title === "hello world!").toMergeSql())
        .toEqual(["select * from Blog",
            "where Title = 'hello world!'"].join(SqlUtils.NewLine));
    expect(from(Blog).where(b => b.Title === "hello world!").toSql()).toEqual({
        sql: ["select * from Blog",
            "where Title = ?"].join(SqlUtils.NewLine),
        params: ['hello world!']
    } as ParamSql);


});

test('skip & take', () => {

    expect(from(Blog).skip(1).toMergeSql())
        .toEqual(["select * from Blog"
            , "limit 1"].join(SqlUtils.NewLine));

    expect(from(Blog).take(1).toMergeSql())
        .toEqual(["select * from Blog"
            , "limit 0,1"].join(SqlUtils.NewLine));

    expect(from(Blog).skip(5).take(10).toMergeSql())
        .toEqual(["select * from Blog"
            , "limit 5,10"].join(SqlUtils.NewLine));

});



test('insert', () => {
    const blog = new Blog()
    blog.UserId = 1
    blog.Title = "Hello World!"
    expect(SqlUtils.insert(blog))
        .toEqual("insert into Blog (UserId,Title,Context) values (1,'Hello World!',null)");


    expect(SqlUtils.insert(blog, true))
        .toEqual({ sql: "insert into Blog (UserId,Title,Context) values (?,?,?)", params: [1, 'Hello World!', null] } as ParamSql);

    expect(SqlUtils.insert({ UserId: 1, Title: blog.Title } as Blog))
        .toEqual("insert into Blog (UserId,Title,Context) values (1,'Hello World!',null)");


    expect(SqlUtils.insert({ UserId: 1, Title: blog.Title } as Blog, true))
        .toEqual({ sql: "insert into Blog (UserId,Title,Context) values (?,?,?)", params: [1, 'Hello World!', null] } as ParamSql);

});



test("update", () => {
    const blog = new Blog()
    blog.UserId = 1
    blog.Title = "Hello World!"

    expect(SqlUtils.updateAll(blog))
        .toEqual("update Blog set UserId = 1,Title = 'Hello World!',Context = null");


    expect(SqlUtils.updateAll(blog, true))
        .toEqual({ sql: "update Blog set UserId = ?,Title = ?,Context = ?", params: [1, 'Hello World!', null] } as ParamSql);


    expect(SqlUtils.update(blog, b => b.Id === 1))
        .toEqual(["update Blog set UserId = 1,Title = 'Hello World!',Context = null"
            , "where Id = 1"].join(SqlUtils.NewLine));

    expect(SqlUtils.update(blog, b => b.Id === 1, true))
        .toEqual({
            sql: ["update Blog set UserId = ?,Title = ?,Context = ?"
                , "where Id = ?"].join(SqlUtils.NewLine), params: [1, 'Hello World!', null, 1]
        } as ParamSql);

    expect(SqlUtils.updateFields({ Title: "abc" } as Blog, b => b.Id === 1))
        .toEqual(["update Blog set Title = 'abc'"
            , "where Id = 1"].join(SqlUtils.NewLine));

    expect(SqlUtils.updateFields({ Title: "abc" } as Blog, b => b.Id === 1, true))
        .toEqual({
            sql: ["update Blog set Title = ?"
                , "where Id = ?"].join(SqlUtils.NewLine), params: ['abc', 1]
        } as ParamSql);

    expect(SqlUtils.updateFieldsForAll({ Title: "abc" } as Blog))
        .toEqual("update Blog set Title = 'abc'");

    expect(SqlUtils.updateFieldsForAll({ Title: "abc" } as Blog, true))
        .toEqual({ sql: "update Blog set Title = ?", params: ['abc'] } as ParamSql);
})

test("delete", () => {
    expect(SqlUtils.delete(User, b => b.Id === 1))
    .toEqual(["delete from users", "where user_id = 1"].join(SqlUtils.NewLine))

    expect(SqlUtils.delete(User, b => b.Id === 1,true))
    .toEqual({sql:["delete from users", "where user_id = ?"].join(SqlUtils.NewLine),params:[1]} as ParamSql)
})