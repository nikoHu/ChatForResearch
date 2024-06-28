export class Entities {
}

export class User {
    id!: number;
    username!: string;
    password!: string;
}

export class Auth {
    user!: User | null;
    hasError!: boolean;
    errMsg!: string | null;
    redirectUrl!: string;
}