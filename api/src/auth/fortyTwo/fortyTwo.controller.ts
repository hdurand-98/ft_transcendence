import { Controller, UseGuards,  } from '@nestjs/common';
import {  ApiTags } from '@nestjs/swagger';
import { Get, Req, Res, } from '@nestjs/common';
import { FortyTwoAuthGuard } from '../guards/42-auth.guard';
import { FortyTwoService } from './fortyTwo.service';



@ApiTags('auth')
@Controller('auth/42')
export class FortyTwoAuthController {

	constructor (
		private fortyTwoService: FortyTwoService
	) {}

	@Get('login')
	@UseGuards(FortyTwoAuthGuard)
	async	login() {
		return ;
	}

	@Get('callback')
	@UseGuards(FortyTwoAuthGuard)
	async	callback (@Req() req, @Res() res)
	{
		return this.fortyTwoService.login(req.user, res);
	}
}
