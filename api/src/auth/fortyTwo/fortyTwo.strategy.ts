import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-42";
import { Injectable } from "@nestjs/common";
import { UserService } from "../../user/user.service";

/*
**	Strategy :
*/
@Injectable()
export class FortyTwoAuthStrategy extends PassportStrategy(Strategy)
{
	constructor (private readonly userService:UserService) {
		super({

			clientID: process.env.API_42_UID,
			clientSecret: process.env.API_42_SECRET,
			callbackURL: process.env.API_42_CALLBACK,
			profileFields: {
				'id': 'id',
				'username': 'login',
				'displayName': 'displayname',
				'email': 'email',
				'image_url': 'image_url'
			  },
		});
	}


	async validate(accessToken: string, refreshToken: string, profile: Profile) {
		const user = await this.userService.findOrCreateUser(
			profile.id,
			profile.displayName,
			profile.username,
			profile.image_url,
			profile.email
		)
		return user;
	}
}
