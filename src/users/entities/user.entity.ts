import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Role } from 'src/common/enum/role.enum';
import { RefreshToken } from '../../token/refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('increment')
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ nullable: true })
  full_name: string;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role: Role;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];
}
