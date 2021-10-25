import { Blog, User, Comment } from "./model";
import { From } from "../src/sql_expr";
import { SqlUtils } from "../src/sql_utils";




test('from', () => {

    expect(From(Blog).ToSql()).toEqual("select * from Blog");
    expect(From(Blog, "b").ToSql()).toEqual("select * from Blog as b");

});

test('single table join', () => {

    expect(From(Blog)
        .Join(User).ON((b, u) => b.UserId === u.Id)
        .ToSql())
        .toEqual([`select * from Blog as b`,
            `join 用户表 as u on b.UserId = u.userId`].join(SqlUtils.NewLine))
    expect(From(Blog, "b").ToSql()).toEqual("select * from Blog as b");

});

test('select fields', () => {

    expect(From(Blog).Select().ToSql()).toEqual("select * from Blog");
    expect(From(Blog).Select("*").ToSql()).toEqual("select * from Blog");
    expect(From(Blog).Select(b => b).ToSql()).toEqual("select Id,UserId,Title from Blog");

});



