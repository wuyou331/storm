
import { Database } from 'storm';
import { Blog } from './model';
import { MssqlDatabase } from './../src/mssql_database';


const db: Database = new MssqlDatabase("")

test("insert", async () => {
    const blog = new Blog()
    blog.name = "Hello World!"
    await expect(db.insert(blog)).resolves.toBeGreaterThan(0)
    await expect(db.insert(blog, true)).resolves.toBeGreaterThan(0)
    await expect(db.insert({ name: "Hello World!" } as Blog)).resolves.toBeGreaterThan(0)

})

