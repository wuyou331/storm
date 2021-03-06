
import { Database } from 'storm';
import { Blog } from './model';
import { MssqlDatabase } from './../src/mssql_database';


const db: Database = new MssqlDatabase("")

test("insert", async () => {
    const blog = new Blog()
    blog.name = "Hello World!"
    await expect(db.insert(blog)).resolves.toBeUndefined()
    await expect(db.insert(blog, true)).resolves.toBeGreaterThan(0)
    await expect(db.insert({ name: "Hello World!" } as Blog,true)).resolves.toBeGreaterThan(1)

    await expect(db.insertFields({ name: "Hello World!" } as Blog,true)).resolves.toBeGreaterThan(1)
})


test('queryList', async () => {
    const sql = db.from(Blog).select((b: Blog) => ({ blogId: b.id }))
    for (const row of await sql.queryList()) {
        expect(row).toHaveProperty("blogId")
    }
});


test('querySingle', async () => {
    const sql = db.from(Blog).where(it => it.id > 1).orderBy(it=>it.id).select()
    await expect(sql.querySingle()).resolves.not.toBeNull()
});



test("update", async () => {
    const blog = new Blog()
    blog.name = "Hello World!"
    const id = await db.insert(blog,true)
    await expect(db.update(blog, b => b.id === id)).resolves.toBeGreaterThan(0)
    await expect(() => db.update({ name: "Hello World!" } as Blog, b => b.id === id)).toThrowError("只支持通过构造函数new出来的对象")
    await expect(db.updateAll(blog)).resolves.toBeGreaterThan(0)
    await expect(db.updateFields({ name: "Hello World!!" } as Blog, b => b.id === id)).resolves.toBeGreaterThan(0)
    await expect(db.updateFieldsForAll({ name: "Hello World!!!" } as Blog)).resolves.toBeGreaterThan(0)
})

test("delete", async () => {
    const id = await db.insert({ name: "Hello World!" } as Blog,true)
    await expect(db.delete(Blog, b => b.id === id)).resolves.toBeGreaterThan(0)
    await expect(db.deleteAll(Blog)).resolves.toBeGreaterThan(0)
})