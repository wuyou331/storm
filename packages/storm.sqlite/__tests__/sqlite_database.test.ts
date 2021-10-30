
import { Database } from 'storm';
import { SqliteDatabase } from '../src/sqlite_database';
import { Blog } from './model';


const db: Database = new SqliteDatabase("__tests__\\data.db")


test('queryList', async () => {
    const sql = db.from(Blog).select((b: Blog) => ({ blogId: b.id }))
    for (const row of await sql.queryList()) {
        expect(row).toHaveProperty("blogId")
    }
});


test('querySingle', async () => {
    const sql = db.from(Blog).select()
    await expect(sql.querySingle()).resolves.not.toBeNull()

});


test("insert", () => {
    const blog = new Blog()
    blog.name = "Hello World!"

    expect(db.insert(blog)).toBe(undefined)

    expect(()=>db.insert({ name: "Hello World!" } as Blog)).toThrowError(new Error("insert方法只支持通过构造函数new出来的对象"))

})