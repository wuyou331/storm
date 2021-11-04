# Storm
Storm is a Simple , Typed ORM for TypeScript.

Storm是一个简单，强类型基于TypeScript语言的ORM框架，它非常简单易学，没有侵入性的POCO实体，没有复杂的实体关系映射，且提供一套强类型的类SQL查询语法，
编写逻辑和结构基本和SQL语句一致，让你在使用SQL的简单直观开发体验的同时亦可享受强类型带来的好处。

![demo](https://raw.githubusercontent.com/wuyou331/storm/main/demo.gif)

## Examples

#### Select
```typescript
db.from(Blog).Where(b=>b.Title == "Hello World!") 
//select * from Blog where Title = 'Hello World' 

//选择部分列
db.from(Blog).Where(b=>b.Title == "Hello World!").Select(b=>b.Id)
//select Id where Title = 'Hello World' 
db.from(Blog).Where(b=>b.Title == "Hello World!").Select(b=>{id:b.Id,title:b.Title})
//select Id as id,Title as title from Blog where Title = 'Hello World' 

//表关联自定义列
db.from(Blog)
.Join(User).ON((b,u)=>b.Creator==u.Id)
.Where<User>(u=>u.Name == "eric johnson")
.Select<Blog,User>((b,u)=>{b,Author:"Joe"})
//select b.Id,b.Title,'Joe' as Author from Blog b
//join User as u on b.Creator = u.Id
//where u.Name = 'eric johnson' 

//子查询
const subQuery = from(User).where(u => u.Name === "eric johnson").select(u => u.Id)
db.from(Blog).where(b => Sql.in(b.UserId, subQuery)
//select * from Blog
//where UserId in (select Id from User",
//                 where Name = 'eric johnson')
```
#### Insert
```typescript
const blog = new Blog()
blog.name = "Hello World!"
db.insert(blog)
db.insert({ name: "Hello World!" } as Blog)
```

#### Update
```typescript
//更新全部字段
db.update(blog, b => b.id === 1)
//update Blog set UserId = 1,Title = 'Hello World!',Context = null where Id = 1

//更新部分字段
db.updateFields({ Title: "abc" } as Blog, b => b.Id === 1)
//update Blog set Title = 'abc' where Id = 1
```

#### Delete
```typescript
//条件删除
db.delete(Blog, b => b.Id === 1)
//delete from Blog where Id = 1

//全表删除
db.deleteAll(Blog)
//delete from Blog
```
