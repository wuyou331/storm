# Storm
Storm Is a Simple , Typed ORM for TypeScript.

Storm是一个简单，强类型基于TypeScript语言的ORM框架，提供一套强类型的类SQL查询语法，只要会写SQL语句5分钟就可以上手，让你可以在使用SQL的开发思想的同时，享受强类型带来的好处。

![demo](https://raw.githubusercontent.com/wuyou331/storm/main/demo.gif)

## 一些Demo

```typescript
From(Blog).Where(b=>b.Title == "Hello World!") 
```

```sql 
select * from Blog where Title == 'Hello World' 
```


```typescript
From(Blog).Where(b=>b.Title == "Hello World!").Select(b=>b)
```
```sql 
select Id,Title,UserId from Blog where Title == 'Hello World' 
```

```typescript
From(Blog).Join.Where(b=>b.Title == "Hello World!").Select(b=>{Id:b.Id})
```
```sql 
select Id,Title from Blog where Title == 'Hello World' 
```