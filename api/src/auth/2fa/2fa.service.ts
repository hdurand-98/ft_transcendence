import { Injectable, Res } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { authenticator } from 'otplib';
import { User } from '../../user/user.entity';
import { UserService } from '../../user/user.service';
import { Request, Response } from 'express';
import { toDataURL } from 'qrcode';
import { AuthService } from '../auth.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TwoFaService extends AuthService {
	constructor(
		@InjectRepository(User) private userRepo: Repository<User>,
		userService: UserService,
		jwtService: JwtService
	) { super (userService, jwtService); }

	/**
	 * Generate and save in DB a secret for twoFA
	 * @param user User
	 * @returns secret and url to put in qrcode
	 */
	public async generateTwoFactorAuthtificationSecret (user: User): Promise<string[]> {
		let	secret: string;
		if (user.TwoFA_enable)
			secret = (await this.userRepo.createQueryBuilder('User')
						.select(["User.TwoFA_secret"])
						.where({ "id": user.id})
						.getOne()).TwoFA_secret;
		else
			secret = authenticator.generateSecret();
		const	optAuthUrl	= authenticator.keyuri(
			encodeURIComponent(user.name),
			encodeURIComponent(process.env.TWO_FACTOR_AUTHENTICATION_APP_NAME),
			secret
		);

		await this.userService.setTwoFactorAuthenticationSecret(user, secret);
		return [
			secret,
			optAuthUrl
		];
	}

	/**
	 * Generate the cookie after the user successfully log with 2fa
	 * @param user User who try to logged in
	 * @param res HTTP Response with `Set-Cookie` header
	 * @returns json
	 */
	public twofa_login (user: User, @Res() res: Response): Response {
		res.header('Set-Cookie', this.generateCookie(user, true));
		return res.json(JSON.stringify({
			connection: "ok"
		}));
	}

	/**
	 * Generate base64 image
	 * @param text Text to encode
	 * @returns base64 image
	 */
	public async pipeQrCodeURL (text: string): Promise<string>
	{
		return toDataURL(text);
	}

	/**
	 * Check if user enter a valid code
	 * @param code Code enter by the user
	 * @param req Request containing user details
	 * @returns boolean
	 */
	public async isTwoFactorCodeValid (code: string, req: Request) : Promise<boolean>
	{
		const user_secret	= await this.userService.getTwoFASecret(req);
		return (authenticator.verify({
			token: code,
			secret: user_secret,
		}));
	}

	/**
	 * Desactivate and forget secret for user
	 * @param user User who made the request
	 * @returns User
	 */
	async deactivateTwoFa (user: User): Promise<User>
	{
		user.TwoFA_enable = false;
		user.TwoFA_secret = null;
		return await user.save();
	}
}
