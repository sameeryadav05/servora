

declare global
{
    namespace Express{
        interface Request{
            user?:{
                id:string,
                fullName:string,
                email:string,
                role:string
            }
        }
    }
}

export {}