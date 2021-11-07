import { User, Comment, Blog } from "./model";
import { From as from, CreateBuilder } from "./mock_expr";
import { Sql } from './../src/sql';
import { SqlBuilder } from './../src/sql_builder';
import { ParamSql } from "../src/select_expr";


test('from', () => {
    expect(from(Blog).toMergeSql()).toEqual("select * from Blog");
    expect(from(Blog, "b").toMergeSql()).toEqual("select * from Blog as b");

});

test('join', () => {

    expect(from(Blog)
        .join(User).on((b, u) => b.UserId === u.Id)
        .toMergeSql())
        .toEqual([`select * from Blog as b`,
            `join users as u on b.UserId = u.user_id`].join(SqlBuilder.NewLine))

    expect(from(Blog)
        .innerJoin(User).on((b, u) => b.UserId === u.Id)
        .toMergeSql())
        .toEqual([`select * from Blog as b`,
            `inner join users as u on b.UserId = u.user_id`].join(SqlBuilder.NewLine))

    expect(from(Blog)
        .leftJoin(User).on((b, u) => b.UserId === u.Id)
        .toMergeSql())
        .toEqual([`select * from Blog as b`,
            `left join users as u on b.UserId = u.user_id`].join(SqlBuilder.NewLine))

    expect(from(Blog)
        .rightJoin(User).on((b, u) => b.UserId === u.Id)
        .toMergeSql())
        .toEqual([`select * from Blog as b`,
            `right join users as u on b.UserId = u.user_id`].join(SqlBuilder.NewLine))

    expect(from(Blog)
        .join(User).on((b, u) => b.UserId === u.Id && b.Id > 0)
        .toMergeSql())
        .toEqual([`select * from Blog as b`,
            `join users as u on (b.UserId = u.user_id and b.Id > 0)`].join(SqlBuilder.NewLine))

    expect(from(Comment)
        .join(Blog).on((c, b) => c.BlogId === b.Id)
        .join(Blog, User).on((b, bu) => b.UserId === bu.Id)
        .join(Comment, User).on((c, cu) => c.UserId === cu.Id)
        .toMergeSql())
        .toEqual(["select * from Comment as c",
            "join Blog as b on c.BlogId = b.Id",
            "join users as bu on b.UserId = bu.user_id",
            "join users as cu on c.UserId = cu.user_id"].join(SqlBuilder.NewLine))


});

test('select fields', () => {
    expect(from(Blog).select().toMergeSql()).toEqual("select * from Blog");

    expect(from(Blog).select(b => b.Title).toMergeSql()).toEqual("select Title from Blog");

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
            `join users as u on b.UserId = u.user_id`].join(SqlBuilder.NewLine))

});



test('where', () => {
    expect(from(Blog).where(b => b.Id === 123).toMergeSql())
        .toEqual(["select * from Blog"
            , "where Id = 123"].join(SqlBuilder.NewLine));

    expect(from(Blog).where(b => b.Id === 123).toSql()).toEqual({
        sql: ["select * from Blog",
            "where Id = ?"].join(SqlBuilder.NewLine),
        params: [123]
    } as ParamSql);

    expect(from(Blog).where(b => b.Title === "hello world!").toMergeSql())
        .toEqual(["select * from Blog",
            "where Title = 'hello world!'"].join(SqlBuilder.NewLine));
    expect(from(Blog).where(b => b.Title === "hello world!").toSql()).toEqual({
        sql: ["select * from Blog",
            "where Title = ?"].join(SqlBuilder.NewLine),
        params: ['hello world!']
    } as ParamSql);


});

test('where sql in', () => {
    const subQuery = from(User).where(u => u.Name === "wuyou").select(u => u.Id)
    expect(from(Blog).where(b => Sql.in(b.UserId, subQuery)).toMergeSql())
        .toEqual(["select * from Blog",
            "where UserId in (select user_id from users",
            "where name = 'wuyou')"]
            .join(SqlBuilder.NewLine));

    expect(from(Blog).where(b => Sql.notIn(b.UserId, subQuery)).toMergeSql())
        .toEqual(["select * from Blog",
            "where UserId not in (select user_id from users",
            "where name = 'wuyou')"]
            .join(SqlBuilder.NewLine));

    expect(from(Blog).where(b => Sql.in(b.UserId, subQuery)).toSql())
        .toEqual({
            sql: ["select * from Blog",
                "where UserId in (select user_id from users",
                "where name = ?)"]
                .join(SqlBuilder.NewLine), params: ['wuyou']
        } as ParamSql);


    expect(from(Blog).where(b => b.Id > 100 && Sql.in(b.UserId, subQuery)).toSql())
        .toEqual({
            sql: ["select * from Blog",
                "where (Id > ? and UserId in (select user_id from users",
                "where name = ?))"]
                .join(SqlBuilder.NewLine), params: [100, 'wuyou']
        } as ParamSql);


    expect(from(Blog).where(b => Sql.in(b.UserId, [1, 2, 3, 4, 'a'])).toMergeSql())
        .toEqual(["select * from Blog",
            "where UserId in (1,2,3,4,'a')"]
            .join(SqlBuilder.NewLine));


    const arr = [1, 2, 3, 4, 'b']
    expect(from(Blog).where(b => Sql.in(b.UserId, arr)).toMergeSql())
        .toEqual(["select * from Blog",
            "where UserId in (1,2,3,4,'b')"]
            .join(SqlBuilder.NewLine));

});


test(`order`, () => {
    expect(from(Blog).orderBy(b => b.Id).toMergeSql())
        .toEqual(["select * from Blog"
            , "order by Id asc"].join(SqlBuilder.NewLine));

    expect(from(Blog).orderByDescending(b => b.Id).toMergeSql())
        .toEqual(["select * from Blog"
            , "order by Id desc"].join(SqlBuilder.NewLine));


    expect(from(Blog).orderBy(b => b.Id).orderByDescending(b => b.UserId).toMergeSql())
        .toEqual(["select * from Blog"
            , "order by Id asc,UserId desc"].join(SqlBuilder.NewLine));
})

test('skip & take', () => {

    expect(from(Blog).skip(1).toMergeSql())
        .toEqual(["select * from Blog"
            , "limit 1"].join(SqlBuilder.NewLine));

    expect(from(Blog).take(1).toMergeSql())
        .toEqual(["select * from Blog"
            , "limit 0,1"].join(SqlBuilder.NewLine));

    expect(from(Blog).skip(5).take(10).toMergeSql())
        .toEqual(["select * from Blog"
            , "limit 5,10"].join(SqlBuilder.NewLine));

});



test('insert', () => {
    const blog = new Blog()
    blog.UserId = 1
    blog.Title = "Hello World!"

    expect(CreateBuilder().insert(blog))
        .toEqual("insert into Blog (UserId,Title,Context) values (1,'Hello World!',null)");


    expect(CreateBuilder(true).insert(blog))
        .toEqual({ sql: "insert into Blog (UserId,Title,Context) values (?,?,?)", params: [1, 'Hello World!', null] } as ParamSql);

    expect(CreateBuilder().insert({ UserId: 1, Title: blog.Title } as Blog))
        .toEqual("insert into Blog (UserId,Title,Context) values (1,'Hello World!',null)");


    expect(CreateBuilder().insertFields({ UserId: 1, Title: blog.Title } as Blog))
        .toEqual("insert into Blog (UserId,Title) values (1,'Hello World!')");


    expect(CreateBuilder(true).insert({ UserId: 1, Title: blog.Title } as Blog))
        .toEqual({ sql: "insert into Blog (UserId,Title,Context) values (?,?,?)", params: [1, 'Hello World!', null] } as ParamSql);


    expect(CreateBuilder(true).insertFields({ UserId: 1, Title: blog.Title } as Blog))
        .toEqual({ sql: "insert into Blog (UserId,Title) values (?,?)", params: [1, 'Hello World!'] } as ParamSql);
});



test("update", () => {
    const blog = new Blog()
    blog.UserId = 1
    blog.Title = "Hello World!"

    expect(CreateBuilder().updateAll(blog))
        .toEqual("update Blog set UserId = 1,Title = 'Hello World!',Context = null");


    expect(CreateBuilder(true).updateAll(blog))
        .toEqual({ sql: "update Blog set UserId = ?,Title = ?,Context = ?", params: [1, 'Hello World!', null] } as ParamSql);


    expect(CreateBuilder().update(blog, b => b.Id === 1))
        .toEqual(["update Blog set UserId = 1,Title = 'Hello World!',Context = null"
            , "where Id = 1"].join(SqlBuilder.NewLine));

    expect(CreateBuilder(true).update(blog, b => b.Id === 1))
        .toEqual({
            sql: ["update Blog set UserId = ?,Title = ?,Context = ?"
                , "where Id = ?"].join(SqlBuilder.NewLine), params: [1, 'Hello World!', null, 1]
        } as ParamSql);

    expect(CreateBuilder().updateFields({ Title: "abc" } as Blog, b => b.Id === 1))
        .toEqual(["update Blog set Title = 'abc'"
            , "where Id = 1"].join(SqlBuilder.NewLine));

    expect(CreateBuilder(true).updateFields({ Title: "abc" } as Blog, b => b.Id === 1))
        .toEqual({
            sql: ["update Blog set Title = ?"
                , "where Id = ?"].join(SqlBuilder.NewLine), params: ['abc', 1]
        } as ParamSql);

    expect(CreateBuilder().updateFieldsForAll({ Title: "abc" } as Blog))
        .toEqual("update Blog set Title = 'abc'");

    expect(CreateBuilder(true).updateFieldsForAll({ Title: "abc" } as Blog))
        .toEqual({ sql: "update Blog set Title = ?", params: ['abc'] } as ParamSql);
})

test("delete", () => {
    expect(CreateBuilder().delete(User, b => b.Id === 1))
        .toEqual(["delete from users", "where user_id = 1"].join(SqlBuilder.NewLine))


    expect(CreateBuilder(true).delete(User, b => b.Id === 1))
        .toEqual({ sql: ["delete from users", "where user_id = ?"].join(SqlBuilder.NewLine), params: [1] } as ParamSql)
})