import { forwardRef, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CheatAuthController, AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { UserModule } from '../user/user.module';
import { FortyTwoAuthStrategy } from './fortyTwo/fortyTwo.strategy';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { jwtConstants } from './jwt/jwt.constants';
import { JwtStrategy } from './jwt/jwt.strategy';
import { HttpModule } from '@nestjs/axios';
import { TwoFaService } from './2fa/2fa.service';
import { FortyTwoService } from './fortyTwo/fortyTwo.service';
import { FortyTwoAuthController } from './fortyTwo/fortyTwo.controller';
import { TwoFAAuthController } from './2fa/2fa.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    PassportModule.register({ property: 'user' }),
    forwardRef(() => UserModule),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: jwtConstants.expire_time }
    }),
    HttpModule
  ],
  providers: [AuthService, FortyTwoAuthStrategy, JwtStrategy, TwoFaService, FortyTwoService],
  controllers: [FortyTwoAuthController, CheatAuthController, TwoFAAuthController, AuthController],
})
export class AuthModule {}
