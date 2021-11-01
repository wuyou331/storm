
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


test("insert", async () => {
    const blog = new Blog()
    blog.name = "Hello World!"
    await expect(db.insert(blog)).resolves.toBeGreaterThan(0)
    await expect(db.insert(blog, true)).resolves.toBeGreaterThan(0)
    await expect(db.insert({ name: "Hello World!" } as Blog)).resolves.toBeGreaterThan(0)

})