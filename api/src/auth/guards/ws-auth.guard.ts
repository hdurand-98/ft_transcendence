import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';
import { JwtService, JwtVerifyOptions } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { jwtConstants } from '../jwt/jwt.constants';
import { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { JwtPayload } from '../payload.type';

@Injectable()
export class WsJwtAuthGuard implements CanActivate {
	constructor(
		private readonly jwtService: JwtService,
		private readonly userService: UserService
	) {}

	async canActivate(context: ExecutionContext): Promise<boolean> {

		try {
			const client: Socket = context.switchToWs().getClient<Socket>();
			const authCookies: string[] = client.handshake.headers.cookie.split('; ');
			const authCookie: string[] = authCookies.filter(s => s.includes('Authentication='));
			const authToken = authCookie[0].substring(15, authCookie[0].length);
			const jwtOptions: JwtVerifyOptions = {
				secret: jwtConstants.secret
			}
			const jwtPayload: JwtPayload = await this.jwtService.verify(authToken, jwtOptions);
			const user: User = await this.userService.getUserByIdentifier(jwtPayload.sub);
			client.data.user = user;
			return Boolean(user);
		} catch (err) {
			throw new WsException(err.message);
		}
	}
}
