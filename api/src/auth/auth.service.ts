import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { jwtConstants } from './jwt/jwt.constants';
import { JwtPayload } from './payload.type';

@Injectable()
export class AuthService {
	constructor(
		protected userService: UserService,
		protected jwtService: JwtService
	) {}

	protected	generateCookie(user: User, isSecondFactorAuthenticated:boolean = false)
	{
		const payload: JwtPayload = {
			sub: user.id,
			isSecondFactorAuthenticated
		}
		const token = this.jwtService.sign(payload);
		const cookie = `Authentication=${token}; Path=/; Max-Age=18000`;
		return cookie;
	}
}
