# Storm
Storm Is a Simple , Typed ORM for TypeScript.

Storm是一个简单，强类型基于TypeScript语言的ORM框架，它没有复杂的实体关系映射，容易学习上手，提供一套强类型的类SQL查询语法，编写逻辑和结构基本和SQL语句一致，但同时可享受强类型带来的好处。

![demo](https://raw.githubusercontent.com/wuyou331/storm/main/demo.gif)

## Examples

### 简单查询
```typescript
From(Blog).Where(b=>b.Title == "Hello World!") 
// select * from Blog where Title = 'Hello World' 
```
### 选择部分列
```typescript
From(Blog).Where(b=>b.Title == "Hello World!").Select(b=>{id:b.Id,title:b.Title})
// select Id,Title from Blog where Title = 'Hello World' 
```
### 表关联自定义列
```typescript
From(Blog)
.Join(User).ON((b,u)=>b.Creator==u.Id)
.Where<User>(u=>u.Name == "wuyou")
.Select<Blog,User>((b,u)=>{b,Author:"Joe"})
// select b.Id,b.Title,'Joe' as Author from Blog b
// join User as u on b.Creator == u.Id
// where u.Name = 'wuyou' 
```
