import { Blog, User, Comment } from "./model";
import { From } from "../src/sql_expr";




test('select', () => {

    expect( From(Blog).ToSql()).toEqual("select * from Blog");
    expect( From(Blog,"b").ToSql()).toEqual("select * from Blog as b");
});