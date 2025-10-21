/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { RefreshToken } from 'src/token/refresh-token.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { Register } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { Login } from './dto/login.dto';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(RefreshToken)
    private refreshTokenRepository: Repository<RefreshToken>,
  ) {}

  async register(dto: Register) {
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) {
      throw new UnauthorizedException('Email already in use');
    }

    const hash = await bcrypt.hash(dto.password, 10);
    const user = this.userRepository.create({
      email: dto.email,
      password_hash: hash,
      full_name: dto.full_name,
    });
    return this.userRepository.save(user);
  }

  async login(dto: Login) {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user || !(await bcrypt.compare(dto.password, user.password_hash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, role: user.role };

    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.refreshTokenRepository.save({
      user,
      token_hash: tokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  async refresh(oldToken: string) {
    const tokenHash = crypto
      .createHash('sha256')
      .update(oldToken)
      .digest('hex');
    console.log('Token Hash:', tokenHash);

    const existingToken = await this.refreshTokenRepository.findOne({
      where: { token_hash: tokenHash, revoked: false },
      relations: ['user'],
    });

    if (!existingToken || existingToken.expires_at < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    existingToken.revoked = true;
    await this.refreshTokenRepository.save(existingToken);

    const user = await this.userRepository.findOne({
      where: { id: existingToken.user.id },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      role: user.role,
    });

    const newRefreshToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = crypto
      .createHash('sha256')
      .update(newRefreshToken)
      .digest('hex');

    await this.refreshTokenRepository.save({
      user: user,
      token_hash: newTokenHash,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }
  async logout(token: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const existingToken = await this.refreshTokenRepository.findOne({
      where: { token_hash: tokenHash, revoked: false },
    });

    if (existingToken) {
      existingToken.revoked = true;
      await this.refreshTokenRepository.save(existingToken);
    }
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'email', 'full_name', 'role'],
    });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async editProfile(id: string, body: any) {
    if (!body || Object.keys(body).length === 0) {
      throw new UnauthorizedException('Request body is empty');
    }

    const user = await this.userRepository.findOne({
      where: { id: Number(id) },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (body.full_name !== undefined && body.full_name !== null) {
      user.full_name = body.full_name;
    }

    if (body.password !== undefined && body.password !== null) {
      user.password_hash = await bcrypt.hash(body.password, 10);
    }

    return this.userRepository.save(user);
  }
}
