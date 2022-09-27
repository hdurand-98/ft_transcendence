import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Get, Req, Res } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserService } from '../user/user.service';
import { Request, Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { FortyTwoService } from './fortyTwo/fortyTwo.service';


@ApiTags('auth')
@Controller('auth/cheat')
export class CheatAuthController {
	constructor (
		private fortyTwoService: FortyTwoService,
		private httpService: HttpService,
		private userService: UserService
	) {}

	@Get('login')
	async login  (@Res() res) {
		const { data } = await firstValueFrom(this.httpService.get("https://api.namefake.com/"));
		const fake = JSON.parse(JSON.stringify(data));

		const image: string[] = [
			"https://fr.web.img6.acsta.net/r_1920_1080/medias/nmedia/18/62/48/25/18645943.jpg",
			"https://img.phonandroid.com/2018/11/xavier-niel-portrait.jpg",
			"https://upload.wikimedia.org/wikipedia/commons/e/eb/Joseph_Stalin_at_the_Tehran_conference_on_1943.jpg",
			"https://upload.wikimedia.org/wikipedia/commons/a/a6/Nicolas_Sarkozy_in_2010.jpg",
			"https://upload.wikimedia.org/wikipedia/commons/d/de/Bernard_Arnault_%283%29_-_2017_%28cropped%29.jpg",
			"https://www.challenges.fr/assets/img/2016/06/07/cover-r4x3w1000-59c3e4252e6e8-liliane-bettencourt.jpg",

		]

		const user = await this.userService.findOrCreateUser(
			Math.floor(100000 + Math.random() * 900000),
			fake.name,
			fake.username,
			image[Math.floor(Math.random()*image.length)],
			fake.email_u + "@" + fake.email_d
		)

		return this.fortyTwoService.login(user, res);
	}

}
@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor () {}

	@Get('logout')
	@ApiOperation({ summary: "Disconnect user by deleting cookie"})
	@ApiResponse({ status: 200, description: "User succesfully disconnected" })
	@ApiResponse({ status: 403, description: "User is not logged in" })
	@ApiBearerAuth()
	@UseGuards(JwtAuthGuard)
	async logout(@Req() req: Request, @Res() res: Response) {
		const cookie = `Authentication=deleted; HttpOnly; Path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
		res.setHeader('Set-Cookie', cookie);
		res.send()
	}
}
