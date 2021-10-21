export class User {
    Id: number
    Name: string
    Gender: boolean
}

export class Blog {
    Id: number
    UserId: number
    Title: string
}

export class Comment {
    Id: number
    UserId: number
    BlogId: number
    Content: string
}