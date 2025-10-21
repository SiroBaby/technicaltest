import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class Register {
  @IsEmail()
  email: string;

  @MinLength(6)
  password: string;

  @IsNotEmpty()
  full_name: string;
}
