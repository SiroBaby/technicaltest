import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  Req,
  Param,
  Put,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Register } from './dto/register.dto';
import { Login } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Roles } from './decorators/roles.decorator';
import { Role } from '../common/enum/role.enum';
import { RateLimit } from './decorators/rate-limit.decorator';
import { RolesGuard } from './guards/roles.guard';

@Controller('api/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @RateLimit(10)
  register(@Body() dto: Register) {
    return this.authService.register(dto);
  }

  @Post('login')
  @RateLimit(20)
  login(@Body() dto: Login) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @RateLimit(30)
  refresh(@Body('refreshToken') token: string) {
    return this.authService.refresh(token);
  }

  @Post('logout')
  @RateLimit(30)
  logout(@Body('refreshToken') token: string) {
    return this.authService.logout(token);
  }

  @Get('profile')
  @RateLimit(60)
  @UseGuards(JwtAuthGuard, RolesGuard)
  profile(@Req() req) {
    return this.authService.getProfile(req.user.userId);
  }

  @Put('profile/:id')
  @RateLimit(100)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  editProfile(@Param('id') id: string, @Body() body) {
    return this.authService.editProfile(id, body);
  }
}
