# Storm
Storm Is a Simple , Typed ORM for TypeScript.

Storm是一个简单，强类型基于TypeScript语言的ORM框架，提供一套强类型的类SQL查询语法，只要会写SQL语句5分钟就可以上手，让你可以在使用SQL的开发思想的同时，享受强类型带来的好处（代码提示，自动重构，编译检查等）。

![demo](https://raw.githubusercontent.com/wuyou331/storm/main/demo.gif)

## Examples
---

```typescript
From(Blog).Where(b=>b.Title == "Hello World!") 
// select * from Blog where Title == 'Hello World' 
```


```typescript
From(Blog).Where(b=>b.Title == "Hello World!").Select(b=>b)
// select Id,Title,UserId from Blog where Title == 'Hello World' 
```

```typescript
From(Blog)
.Join(User).ON((b,u)=>b.Creator==u.Id)
.Where<User>(u=>u.Name == "wuyou")
.Select<Blog,User>((b,u)=>{b,Author:u.Name})
// select b.Id,b.Title,u.Name as Author from Blog b
// join User as u on b.CreatorId == u.Id
// where u.Name == 'wuyou' 
```