import { Controller, UseGuards, HttpStatus, HttpException, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBearerAuth, ApiCookieAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Get, Req, Res, Post, Body } from '@nestjs/common';
import { UserService } from '../../user/user.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { twoFaDto } from '../../dtos/twofa_token.dto';
import { User } from '../../user/user.entity';
import { TwoFaService } from './2fa.service';

@ApiTags('auth')
@Controller('auth/2fa')
export class TwoFAAuthController {
	constructor (
		private userService: UserService,
		private twoFaService: TwoFaService
	) {}

	/**
	 * Generate a secret key for user
	 * @param req Request sent by nav containing user object
	 * @returns secret and base64 encoded qrcode
	 */
	@Get('generate')
	@ApiOperation({ summary: "Generate a QRCode use by application for turn-on 2fa" })
	@ApiResponse({
		status: 200,
		description: "QRCode have been generated",
		content: {
			'application/json': {
			  example: {
				"qrcode": "<base64_qrcode>",
				"secret": "<string_secret>"
			  }
			},
		  },
	})
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	async generate (@Req() req: Request) {
		const user: User = await (await this.userService.getUserByRequest(req));
		const [
			secret,
			optAuthUrl
		 ] = await this.twoFaService.generateTwoFactorAuthtificationSecret(user);
		const qrcode = await this.twoFaService.pipeQrCodeURL(optAuthUrl);

		return {
			qrcode,
			secret
		};
	}

	@Post('turn-on')
	@ApiOperation({ summary: "Turn On TwoFA for the connected user if validation code is correct" })
	@ApiResponse({ status: 201, description: "TwoFA have been enable on user account" })
	@ApiResponse({ status: 401, description: "Unvalid token sent" })
	@ApiResponse({ status: 403, description: "User is not logged in" })
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	@UsePipes(ValidationPipe)
	async turnOnTwoFA (@Req() req: Request, @Res() res: Response, @Body() twofa_token : twoFaDto) {
		const isValidCode = await this.twoFaService.isTwoFactorCodeValid(
			twofa_token.token,
			req
		);
		if (!isValidCode)
			throw new HttpException('Wrong 2FA', HttpStatus.UNAUTHORIZED);
		await this.userService.turnOnTwoFactorAuthentication(req);
		this.twoFaService.twofa_login(
			await this.userService.getUserByRequest(req),
			res
		);
	}

	@Post('validate')
	@ApiOperation({ summary: "Validate twoFa code" })
	@ApiResponse({ status: 201, description: "TwoFa token is valid" })
	@ApiResponse({ status: 401, description: "Unvalid token sent" })
	@ApiResponse({ status: 403, description: "User is not logged in" })
	@ApiCookieAuth()
	@UseGuards(JwtAuthGuard)
	@UsePipes(ValidationPipe)
	async validateTwoFa(@Req() req, @Res() res: Response, @Body() twofa_token: twoFaDto) {
		const isValidCode = await this.twoFaService.isTwoFactorCodeValid(
			twofa_token.token,
			req
		);
		if (!isValidCode)
			throw new HttpException('Wrong 2FA', HttpStatus.UNAUTHORIZED);
		this.twoFaService.twofa_login(
			await this.userService.getUserByRequest(req),
			res
		);
	}

	@Post('deactivate')
	@ApiOperation({ summary: "Deactivate twofa for current user" })
	@ApiResponse({ status: 201, description: "TwoFa is deactivate for current user" })
	@ApiResponse({ status: 403, description: "User is not logged in" })
	@ApiCookieAuth()
	@UseGuards(JwtAuthGuard)
	async deactivateTwoFa(@Req() req)
	{
		const user: User = await this.userService.getUserByRequest(req);
		return await this.twoFaService.deactivateTwoFa(user);
	}
}
