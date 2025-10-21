import { IsEmail, MinLength } from 'class-validator';

export class Login {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;
}
