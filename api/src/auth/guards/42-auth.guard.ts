import { Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class FortyTwoAuthGuard extends AuthGuard('42') {
	handleRequest<TUser = any>(err, user): TUser {
		if (err || !user)
		{
			return null;
		}
		return user;
	}
}
