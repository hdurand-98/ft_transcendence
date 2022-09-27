import { Injectable, Res } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../user/user.entity';
import { Response } from 'express';
import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';

@Injectable()
export class FortyTwoService extends AuthService {
	constructor(
		userService: UserService,
		jwtService: JwtService
	) {
		super(userService, jwtService);
	}

	/**
	 * Login user, generate cookie without 2FA validate
	 * @param user User who made login request
	 * @param res Response for handle redirect
	 * @returns redirection
	 */
	public login (user: User, @Res() res: Response) {
		if (user)
		{
			if (user.TwoFA_enable)
			{
				res.header('Set-Cookie', this.generateCookie(user));
				return res.redirect('/2fa');
			}
			res.header('Set-Cookie', this.generateCookie(user, true));
			return res.redirect('/');
		}
		return res.redirect('/login');
	}
}
